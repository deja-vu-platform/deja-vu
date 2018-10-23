import { Component, OnInit, Input, ViewChild, ComponentFactoryResolver, Type } from '@angular/core';
import { WidgetDirective } from '../widget.directive';
import { BaseWidget } from '../datatypes';

@Component({
  selector: 'app-widget',
  templateUrl: './widget.component.html',
  styleUrls: ['./widget.component.scss'],
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
