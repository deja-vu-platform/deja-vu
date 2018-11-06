import { Component, Input } from '@angular/core';

@Component({
  selector: 'mapmit-group-with-user',
  templateUrl: './group-with-user.component.html',
  styleUrls: ['./group-with-user.component.css']
})
export class GroupWithUserComponent {
  @Input() group: Group;
  @Input() loggedInUserId: string;
}

interface Group {
  id: string;
  memberIds: string[];
  subgroups: Group[]
};
