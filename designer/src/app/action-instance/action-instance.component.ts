import {
  Component,
  ComponentFactoryResolver,
  Input,
  OnInit,
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
export class ActionInstanceComponent implements OnInit {
  @Input() actionInstance: ActionInstance;
  @ViewChild(ClicheActionDirective) actionHost: ClicheActionDirective;

  constructor(private componentFactoryResolver: ComponentFactoryResolver) { }

  ngOnInit() {
    if (this.actionInstance && this.actionInstance.of['component']) {
      this.loadClicheAction();
    }
  }

  loadClicheAction() {
    const { component } = <ClicheActionDefinition>this.actionInstance.of;
    const componentFactory = this.componentFactoryResolver
      .resolveComponentFactory(<Type<{}>>component);
    const viewContainerRef = this.actionHost.viewContainerRef;
    viewContainerRef.clear();
    const componentRef = viewContainerRef.createComponent(componentFactory);
    componentRef.instance['actionInstance'] = this.actionInstance;
  }
}
