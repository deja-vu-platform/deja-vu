import { Component } from '@angular/core';
import { ShowGroupComponent } from '../show-group/show-group.component';

@Component({
  selector: 'mapmit-show-my-groups',
  templateUrl: './show-my-groups.component.html',
  styleUrls: ['./show-my-groups.component.css']
})
export class ShowMyGroupsComponent {
  user: User;
  showGroup = ShowGroupComponent;
}

interface User {
  id: string;
  username: string;
  password?: string;
}
