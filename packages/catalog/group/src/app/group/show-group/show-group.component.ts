import { Component, Input, Type } from '@angular/core';

import { Action } from 'dv-core';

import { Group } from '../shared/group.model';
import { ShowMemberComponent } from '../show-member/show-member.component';

@Component({
  selector: 'group-show-group',
  templateUrl: './show-group.component.html',
  styleUrls: ['./show-group.component.css']
})
export class ShowGroupComponent {
  // One of `group` or `id` is required
  @Input() group: Group | undefined;
  @Input() id: string | undefined;

  @Input() showMembers = true;

  @Input() showMember: Action = {
    type: <Type<Component>> ShowMemberComponent
  };

  showGroup;

  constructor() {
    this.showGroup = this;
  }
}
