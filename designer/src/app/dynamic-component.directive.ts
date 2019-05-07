import { Directive, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[propertyDynamicComponent]'
})
export class DynamicComponentDirective {

  constructor(public viewContainerRef: ViewContainerRef) { }

}
