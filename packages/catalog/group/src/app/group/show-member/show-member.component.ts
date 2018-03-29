import { Component, Input } from '@angular/core';

import { Member } from '../shared/group.model';

@Component({
  selector: 'group-show-member',
  templateUrl: './show-member.component.html',
  styleUrls: ['./show-member.component.css']
})
export class ShowMemberComponent {
  // One of these is required
  @Input() member: Member | undefined;
  @Input() id: string | undefined;
}
