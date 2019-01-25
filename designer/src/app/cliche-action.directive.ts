import { Directive, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[propertyClicheAction]'
})
export class ClicheActionDirective {

  constructor(public viewContainerRef: ViewContainerRef) { }

}
