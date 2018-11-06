import { Component } from '@angular/core';
import { GroupWithUserComponent } from '../group-with-user/group-with-user.component';

@Component({
  selector: 'mapmit-user-groups',
  templateUrl: './user-groups.component.html',
  styleUrls: ['./user-groups.component.css']
})
export class UserGroupsComponent {
  user: User;
  groupWithUser = GroupWithUserComponent;

  getMemberIds() {
    return this.user ? [this.user.id] : undefined;
  }
}

interface User {
  id: string;
  username: string;
  password?: string;
}
