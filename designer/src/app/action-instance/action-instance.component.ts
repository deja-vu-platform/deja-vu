import {
  AfterViewInit,
  Component,
  ComponentFactoryResolver,
  Input,
  Type,
  ViewChild
} from '@angular/core';

import { ClicheActionDirective } from '../cliche-action.directive';
import { ActionInstance, ClicheActionDefinition } from '../datatypes';

@Component({
  selector: 'app-action-instance',
  templateUrl: './action-instance.component.html',
  styleUrls: ['./action-instance.component.scss']
})
export class ActionInstanceComponent implements AfterViewInit {
  @Input() actionInstance: ActionInstance;
  @ViewChild(ClicheActionDirective) actionHost: ClicheActionDirective;

  constructor(private componentFactoryResolver: ComponentFactoryResolver) { }

  ngAfterViewInit() {
    if (this.actionInstance && this.actionInstance.of['component']) {
      // cliche actions check DOM attrs which aren't there until afterViewInit
      // setTimeout is necessary to avoid angular change detection errors
      setTimeout(this.loadClicheAction);
    }
  }

  loadClicheAction = () => {
    const { component } = <ClicheActionDefinition>this.actionInstance.of;
    const componentFactory = this.componentFactoryResolver
      .resolveComponentFactory(<Type<{}>>component);
    const viewContainerRef = this.actionHost.viewContainerRef;
    viewContainerRef.clear();
    const componentRef = viewContainerRef.createComponent(componentFactory);
    componentRef.instance['actionInstance'] = this.actionInstance;
  }

  get dvAlias() {
    return `${this.actionInstance.from.name}-${this.actionInstance.of.name}`;
  }
}
