import {
  Component,
  ComponentFactoryResolver,
  Input,
  OnInit,
  Type,
  ViewChild
} from '@angular/core';
import { BaseWidget } from '../datatypes';
import { WidgetDirective } from '../widget.directive';

@Component({
  selector: 'app-widget',
  templateUrl: './widget.component.html',
  styleUrls: ['./widget.component.scss']
})
export class WidgetComponent implements OnInit {
  @Input() widget: BaseWidget;
  @ViewChild(WidgetDirective) widgetHost: WidgetDirective;

  constructor(private componentFactoryResolver: ComponentFactoryResolver) { }

  ngOnInit() {
    this.loadWidget();
  }

  loadWidget() {
    const componentFactory = this.componentFactoryResolver
      .resolveComponentFactory(<Type<{}>>this.widget.component);
    const viewContainerRef = this.widgetHost.viewContainerRef;
    viewContainerRef.clear();
    const componentRef = viewContainerRef.createComponent(componentFactory);
    componentRef.instance['widget'] = this.widget;
  }
}
