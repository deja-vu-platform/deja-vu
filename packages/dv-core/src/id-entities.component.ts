import {
  Component, Input, OnChanges, Output, EventEmitter
} from '@angular/core';
import { v4 as uuid } from 'uuid';

import * as _ from 'lodash';


@Component({
  selector: 'dv-id-entities',
  template: ``
})
export class IdEntitiesComponent implements OnChanges {
  @Input() entities: any[] = [];
  @Output() entitiesWithId = new EventEmitter<any[]>();

  ngOnChanges() {
    if (!_.isEmpty(this.entities)) {
      this.entitiesWithId.emit(_.map(this.entities, (entity) => {
        entity.id = uuid();
        return entity;
      }));
    }
  }
}
