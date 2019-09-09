import { Directive, ViewContainerRef } from '@angular/core';

// https://angular.io/guide/dynamic-component-loader
@Directive({
  selector: '[propertyDynamicComponent]'
})
export class DynamicComponentDirective {

  constructor(public viewContainerRef: ViewContainerRef) { }

}
