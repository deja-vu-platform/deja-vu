import { Component } from '@angular/core';

@Component({
  selector: 'mapmit-user-groups',
  templateUrl: './user-groups.component.html',
  styleUrls: ['./user-groups.component.css']
})
export class UserGroupsComponent {
  user: User;

  getMemberIds() {
    return this.user ? '["' + this.user.id + '"]' : undefined;
  }
}

interface User {
  id: string;
  username: string;
  password?: string;
}
