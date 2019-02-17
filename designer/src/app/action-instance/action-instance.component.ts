import {
  AfterViewInit,
  Component,
  ComponentFactoryResolver,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Type,
  ViewChild
} from '@angular/core';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';

import { ClicheActionDirective } from '../cliche-action.directive';
import {
  ActionInstance,
  AppActionDefinition,
  ClicheActionDefinition
} from '../datatypes';
import { ActionIO, ScopeIO} from '../io';


@Component({
  selector: 'app-action-instance',
  templateUrl: './action-instance.component.html',
  styleUrls: ['./action-instance.component.scss']
})
export class ActionInstanceComponent
implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild(ClicheActionDirective)
    private readonly actionHost: ClicheActionDirective;
  @Input() actionInstance: ActionInstance;
  @Input() actionIO: ActionIO;
  private readonly scopeIO: ScopeIO = new ScopeIO();
  private subscriptions: Subscription[] = [];
  // for when rendered in dv-include only
  @Input() extraInputs?: string[];
  @Input() extraInputsScope?: ActionIO;

  constructor(
    private readonly componentFactoryResolver: ComponentFactoryResolver
  ) { }

  ngOnInit() {
    if (this.actionInstance && this.actionIO) {
      this.scopeIO.setActionIO(this.actionInstance, this.actionIO);
      if (this.extraInputs && this.extraInputsScope) {
        this.extraInputs.forEach((ioName) => {
          this.extraInputsScope.getSubject(ioName)
            .next(this[ioName]);
        });
      }
    }
  }

  ngAfterViewInit() {
    if (this.actionInstance) {
      if (this.actionInstance.of instanceof AppActionDefinition) {
        this.scopeIO.link(this.actionInstance);
      } else {
        // setTimeout is necessary to avoid angular change detection errors
        setTimeout(() => this.loadClicheAction());
      }
    }
  }

  loadClicheAction() {
    // create component and add to DOM
    const actionDefinition = <ClicheActionDefinition>this.actionInstance.of;
    const { component } = actionDefinition;
    const componentFactory = this.componentFactoryResolver
      .resolveComponentFactory(<Type<{}>>component);
    const viewContainerRef = this.actionHost.viewContainerRef;
    viewContainerRef.clear();
    const componentRef = viewContainerRef.createComponent(componentFactory);

    // subscribe to outputs, storing last outputted value
    actionDefinition.outputs.forEach((output) => {
      this.subscriptions.push(
        (<EventEmitter<any>>componentRef.instance[output]).subscribe((val) => {
          this.actionIO.getSubject(output)
            .next(val);
        })
      );
    });

    // pass in inputs, and allow the value to be updated
    actionDefinition.inputs.forEach((input) => {
      // give new values
      this.subscriptions.push(
        this.actionIO.getSubject(input)
          .subscribe((val) => {
            if (val !== undefined) {
              componentRef.instance[input] = val;
            }
          })
      );
    });

    // pass the instance for the text action
    if (this.shouldPassActionInstance()) {
      componentRef.instance['actionInstance'] = this.actionInstance;
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach((s) => s.unsubscribe());
    this.scopeIO.unlink();
  }

  shouldPassActionInstance() {
    return (
      this.actionInstance.from.name === 'dv'
      && this.actionInstance.of.name === 'text'
    );
  }
}

function isComponent(inputValue: any) {
  return (
    _.isObject(inputValue)
    && _.isFunction(inputValue.type)
    && _.isString(inputValue.type.name)
    && inputValue.type.name.endsWith('Component')
  );
}
