import {
  AfterViewInit,
  Component,
  ComponentFactoryResolver,
  EventEmitter,
  Input,
  OnDestroy,
  Type,
  ViewChild
} from '@angular/core';
import { Subscription } from 'rxjs';

import { ClicheActionDirective } from '../cliche-action.directive';
import { ActionInstance, ClicheActionDefinition } from '../datatypes';

@Component({
  selector: 'app-action-instance',
  templateUrl: './action-instance.component.html',
  styleUrls: ['./action-instance.component.scss']
})
export class ActionInstanceComponent implements AfterViewInit, OnDestroy {
  @Input() actionInstance: ActionInstance;
  @ViewChild(ClicheActionDirective) actionHost: ClicheActionDirective;
  subscriptions: Subscription[] = [];

  constructor(private componentFactoryResolver: ComponentFactoryResolver) { }

  ngAfterViewInit() {
    if (this.actionInstance && this.actionInstance.of['component']) {
      // cliche actions check DOM attrs which aren't there until afterViewInit
      // setTimeout is necessary to avoid angular change detection errors
      setTimeout(() => this.loadClicheAction());
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
          this.actionInstance.io[output].next(val);
        })
      );
    });

    // pass in inputs, and allow the value to be updated
    this.actionInstance.of.inputs.forEach((input) => {
      this.subscriptions.push(
        this.actionInstance.io[input].subscribe((val) => {
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

  // need to give the action the right fqtag
  get dvAlias() {
    return `${this.actionInstance.from.name}-${this.actionInstance.of.name}`;
  }

  shouldPassActionInstance() {
    return (
      this.actionInstance.from.name === 'dv'
      && this.actionInstance.of.name === 'text'
    );
  }
}
