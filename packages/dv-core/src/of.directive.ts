import { Directive, ElementRef, Input } from '@angular/core';

import { OF_ATTR } from './gateway.service';

@Directive({
  selector: '[dvOf]'
})
export class OfDirective {
  @Input('dvOf') ofValue: string;

  constructor(private elem: ElementRef) {}

  ngOnInit() {
    this.elem.nativeElement.setAttribute(OF_ATTR, this.ofValue);
  }
}
