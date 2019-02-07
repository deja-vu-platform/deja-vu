import { Directive, ElementRef, Input } from '@angular/core';

import { NodeUtils } from "./node.utils";

@Directive({
  selector: '[dvOf]'
})
export class OfDirective {
  @Input('dvOf') ofValue: string;

  constructor(private _elem: ElementRef) {}

  ngOnInit() {
    NodeUtils.SetOfOfNode(this._elem.nativeElement, this.ofValue);
  }
}
