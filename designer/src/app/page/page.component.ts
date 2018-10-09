import { Component, AfterViewInit, ViewChildren, QueryList, ComponentFactoryResolver, ChangeDetectorRef } from '@angular/core';
import { ɵe as CreateWeeklySeriesComponent } from 'event'; // TODO: proper import
import { WidgetDirective } from '../widget.directive';


@Component({
  selector: 'app-page',
  templateUrl: './page.component.html',
  styleUrls: ['./page.component.scss']
})
export class PageComponent implements AfterViewInit {
  widgets = [CreateWeeklySeriesComponent];
  @ViewChildren(WidgetDirective) widgetHosts: QueryList<WidgetDirective>;


  constructor(
    private componentFactoryResolver: ComponentFactoryResolver,
    private cdr: ChangeDetectorRef
  ) { }

  ngAfterViewInit() {
    this.loadWidgets();
  }

  loadWidgets() {
    this.widgetHosts.forEach((widgetHost, i) => {
      const widget = this.widgets[i];
      const componentFactory = this.componentFactoryResolver.resolveComponentFactory(widget);
      console.log(this.widgetHosts);
      const viewContainerRef = widgetHost.viewContainerRef;
      viewContainerRef.clear();
      viewContainerRef.createComponent(componentFactory);
    });
    this.cdr.detectChanges();
  }

}
