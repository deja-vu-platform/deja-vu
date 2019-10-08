import {
  Component, ElementRef, EventEmitter, Input, Output, Type
} from '@angular/core';

import { v4 as uuid } from 'uuid';

import { ComponentValue } from '../include/include.component';
import { RunService } from '../run.service';
import { ShowEntityComponent } from '../show-entity/show-entity.component';

import * as _ from 'lodash';


@Component({
  selector: 'dv-choose',
  templateUrl: './choose.component.html'
})
export class ChooseComponent {
  @Input() chooseSelectPlaceholder = 'Choose';
  @Input() showEntity: ComponentValue = {
    type: <Type<Component>> ShowEntityComponent
  };

  @Input() addButtonLabel = 'Add';
  @Input() showChooseButton = true;
  /**
   * Whether or not the selection should be cleared when the component
   * executes sucessfully
   */
  @Input() resetOnExecSuccess = false;
  @Input() execOnSelection = false;

  @Input() entities: any[] = [];
  entityIndex: number | undefined;

  @Input() initialEntityId;

  @Output() selectedEntity = new EventEmitter<any>();

  choose;
  parentId = uuid();


  constructor(private elem: ElementRef, private rs: RunService) {
    this.choose = this;
  }

  ngOnInit() {
    this.rs.register(this.elem, this);
  }

  ngOnChanges(changes) {
    if (changes['entities'] || changes['initialEntityId']) {
      this.entityIndex = _.indexOf(
        _.map(this.entities, 'id'), this.initialEntityId);
    }
  }

  entitySelected() {
    if (!this.showChooseButton) {
      this.selectedEntity.emit(this.entities[this.entityIndex!]);
    }
    if (this.execOnSelection) {
      setTimeout(() => this.rs.exec(this.elem));
    }
  }

  add() {
    this.selectedEntity.emit(this.entities[this.entityIndex!]);
    this.entityIndex = undefined;
  }

  dvOnExecSuccess() {
    if (this.resetOnExecSuccess) {
      this.selectedEntity.emit(undefined);
      this.entityIndex = undefined;
    }
  }
}
