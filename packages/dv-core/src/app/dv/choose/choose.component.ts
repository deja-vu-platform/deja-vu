import { Component, EventEmitter, Input, Output, Type } from '@angular/core';

import { Action } from '../include/include.component';
import { ShowEntityComponent } from '../show-entity/show-entity.component';


@Component({
  selector: 'dv-choose',
  templateUrl: './choose.component.html',
})
export class ChooseComponent {
  @Input() chooseSelectPlaceholder = 'Choose';
  @Input() showEntity: Action = {
    type: <Type<Component>> ShowEntityComponent
  };

  @Input() addButtonLabel = 'Add';

  @Input() entities: any[] = [];
  entityIndex: number | undefined;

  @Output() selectedEntity = new EventEmitter<any>();

  choose;

  constructor() {
    this.choose = this;
  }

  add() {
    this.selectedEntity.emit(this.entities[this.entityIndex!]);
    this.entityIndex = undefined;
  }
}
