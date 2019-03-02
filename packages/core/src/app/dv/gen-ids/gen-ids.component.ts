import {
  Component, EventEmitter, Input, Output
} from '@angular/core';
import { v4 as uuid } from 'uuid';

import * as _ from 'lodash';


@Component({
  selector: 'dv-gen-ids',
  templateUrl: './gen-ids.component.html'
})
export class GenIdsComponent {
  @Output() ids = new EventEmitter<string[]>();
  _for: any[] = [];

  // originally this was a regular input instead of a setter
  // ngOnChanges was used to emit the ids upon setting the input
  // however when the value was set in the designer ngOnChanges didn't fire
  // TODO: investigate why
  @Input()
  set for(a: any[]) {
    this._for = a;
    if (!_.isEmpty(this.for)) {
      this.ids.emit(_.map(this.for, (_unused) => uuid()));
    }
  }

  get for() {
    return this._for;
  }
}
