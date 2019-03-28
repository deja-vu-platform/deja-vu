import { Component, Input } from '@angular/core';

import { Action } from '../include/include.component';


@Component({
  selector: 'dv-for',
  templateUrl: './for.component.html'
})
export class ForComponent {
  @Input() showElem: Action | undefined;
  @Input() elems;

  forComponent = this;
}
