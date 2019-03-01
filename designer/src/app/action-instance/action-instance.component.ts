import {
  AfterViewInit,
  Component,
  ComponentFactoryResolver,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Type,
  ViewChild,
  ElementRef
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
import { RunService } from '@deja-vu/core';


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
  @Input() extraInputs?: { [ioName: string]: string };
  @Input() extraInputsScope?: ActionIO;
  hidden = false;

  constructor(
    private readonly componentFactoryResolver: ComponentFactoryResolver,
    private readonly elem: ElementRef,
    private readonly rs: RunService
  ) { }

  ngOnInit() {
    if (this.actionInstance && this.actionIO) {
      this.scopeIO.setActionIO(this.actionInstance, this.actionIO);
      if (this.extraInputs && this.extraInputsScope) {
        _.forEach(this.extraInputs, (thisProp, ioName) => {
          this.extraInputsScope.getSubject(ioName)
            .next(this[thisProp]);
        });
      }
    }
    if (this.actionInstance && this.actionInstance.isAppAction) {
      this.rs.registerAppAction(this.elem, this);
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
      setTimeout(() => {
        const sub = this.actionIO.getSubject('hidden')
          .subscribe((value) => {
            this.hidden = value;
          });
        this.subscriptions.push(sub);
      });
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
