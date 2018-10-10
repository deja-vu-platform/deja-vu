import { Component, OnInit, Input, ViewChild, ComponentFactoryResolver } from '@angular/core';
import { WidgetDirective } from '../widget.directive';

@Component({
  selector: 'app-widget',
  templateUrl: './widget.component.html',
  styleUrls: ['./widget.component.scss'],
})
export class WidgetComponent implements OnInit {
  @Input() widget;
  @ViewChild(WidgetDirective) widgetHost: WidgetDirective;

  constructor(private componentFactoryResolver: ComponentFactoryResolver) { }

  ngOnInit() {
    this.loadWidget();
  }

  loadWidget() {
    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(this.widget);
    const viewContainerRef = this.widgetHost.viewContainerRef;
    viewContainerRef.clear();
    viewContainerRef.createComponent(componentFactory);
  }
}
