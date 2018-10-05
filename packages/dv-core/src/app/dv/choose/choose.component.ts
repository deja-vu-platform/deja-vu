import {
  Component, ElementRef, EventEmitter, Input, Output, Type
} from '@angular/core';

import { Action } from '../include/include.component';
import { ShowEntityComponent } from '../show-entity/show-entity.component';
import { RunService } from '../run.service';


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

  constructor(private elem: ElementRef, private rs: RunService) {
    this.choose = this;
  }

  ngOnInit() {
    this.rs.register(this.elem, this);
  }

  add() {
    this.selectedEntity.emit(this.entities[this.entityIndex!]);
    this.entityIndex = undefined;
  }
}
