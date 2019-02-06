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
import { ActionIO, linkChildren, ScopeIO } from '../io';

@Component({
  selector: 'app-action-instance',
  templateUrl: './action-instance.component.html',
  styleUrls: ['./action-instance.component.scss']
})
export class ActionInstanceComponent
implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild(ClicheActionDirective)
    private readonly actionHost: ClicheActionDirective;
  @Input() readonly actionInstance: ActionInstance;
  @Input() private readonly actionIO: ActionIO;
  private readonly scopeIO: ScopeIO = new ScopeIO();
  private subscriptions: Subscription[] = [];

  constructor(
    private readonly componentFactoryResolver: ComponentFactoryResolver
  ) { }

  ngOnInit() {
    if (this.actionInstance && this.actionIO) {
      this.scopeIO.setActionIO(this.actionInstance, this.actionIO);
    }
  }

  ngAfterViewInit() {
    if (this.actionInstance) {
      if (this.actionInstance.of instanceof AppActionDefinition) {
        this.subscriptions = linkChildren(this.actionInstance, this.scopeIO);
      } else {
        // setTimeout is necessary to avoid angular change detection errors
        setTimeout(() => this.loadClicheAction());
      }
    }
  }

  loadClicheAction() {
    // create component and add to DOM
    const { component } = <ClicheActionDefinition>this.actionInstance.of;
    const componentFactory = this.componentFactoryResolver
      .resolveComponentFactory(<Type<{}>>component);
    const viewContainerRef = this.actionHost.viewContainerRef;
    viewContainerRef.clear();
    const componentRef = viewContainerRef.createComponent(componentFactory);

    // subscribe to outputs, storing last outputted value
    this.actionInstance.of.outputs.forEach((output) => {
      this.subscriptions.push(
        (<EventEmitter<any>>componentRef.instance[output]).subscribe((val) => {
          this.actionIO.getSubject(output)
            .next(val);
        })
      );
    });

    // pass in inputs, and allow the value to be updated
    this.actionInstance.of.inputs.forEach((input) => {
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
  }

  shouldPassActionInstance() {
    return (
      this.actionInstance.from.name === 'dv'
      && this.actionInstance.of.name === 'text'
    );
  }
}
