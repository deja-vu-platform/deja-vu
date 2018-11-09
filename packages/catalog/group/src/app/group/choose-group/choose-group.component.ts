import { Component, Input, Type, Output, EventEmitter } from '@angular/core';

import { Action } from 'dv-core';

import { Group } from '../shared/group.model';
import { ShowGroupComponent } from '../show-group/show-group.component';

@Component({
  selector: 'group-choose-group',
  templateUrl: './choose-group.component.html',
  styleUrls: ['./choose-group.component.css']
})
export class ChooseGroupComponent {
  groups: Group[];
  @Input() showGroup: Action = {
    type: <Type<Component>>ShowGroupComponent,
    inputMap: { entity: 'group' }
  };

  @Input() withMemberId: string | undefined;

  @Input() showMembers = false;
  @Input() showChooseButton = true;
  @Input() chooseSelectPlaceholder = 'Choose Group';
  @Input() addButtonLabel = 'Add Group';

  @Output() selectedGroup = new EventEmitter<Group>();

  outputSelectedGroup(selectedGroup: Group) {
    this.selectedGroup.emit(selectedGroup);
  }
}
