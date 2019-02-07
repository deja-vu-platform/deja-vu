import { Component, EventEmitter, Input, Output, Type } from '@angular/core';

import { Action } from '@deja-vu/core';

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

  @Input() loadMembers = true;
  @Input() showChooseButton = true;
  @Input() chooseSelectPlaceholder = 'Choose Group';
  @Input() addButtonLabel = 'Add Group';

  @Output() selectedGroup = new EventEmitter<Group>();

  outputSelectedGroup(selectedGroup: Group) {
    this.selectedGroup.emit(selectedGroup);
  }
}
