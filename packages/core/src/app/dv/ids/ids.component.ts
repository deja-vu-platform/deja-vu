import {
  Component, EventEmitter, Input, Output
} from '@angular/core';
import { v4 as uuid } from 'uuid';

import * as _ from 'lodash';


@Component({
  selector: 'dv-ids',
  templateUrl: './ids.component.html'
})
export class IdsComponent {
  @Output() ids = new EventEmitter<string[]>();
  _for: any[] = [];

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
