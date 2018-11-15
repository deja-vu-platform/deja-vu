import { Directive, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[propertyAppWidget]'
})
export class WidgetDirective {

  constructor(public viewContainerRef: ViewContainerRef) { }

}
