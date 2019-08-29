import { Component, Input } from '@angular/core';

import { ComponentValue } from '../include/include.component';


@Component({
  selector: 'dv-for',
  templateUrl: './for.component.html'
})
export class ForComponent {
  @Input() showElem: ComponentValue | undefined;
  @Input() elems;

  forComponent = this;
}
