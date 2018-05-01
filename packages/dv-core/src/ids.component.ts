import {
  Component, Input, OnChanges, Output, EventEmitter
} from '@angular/core';
import { v4 as uuid } from 'uuid';

import * as _ from 'lodash';


@Component({
  selector: 'dv-ids',
  template: ``
})
export class IdsComponent implements OnChanges {
  @Input() for: any[] = [];
  @Output() ids = new EventEmitter<string>();

  ngOnChanges() {
    if (!_.isEmpty(this.for)) {
      this.ids.emit(_.map(this.for, (unused) => uuid()));
    }
  }
}
