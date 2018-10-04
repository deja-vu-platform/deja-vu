import {Component, EventEmitter, Input, Output, Type} from '@angular/core';

import { Action } from 'dv-core';

import { ShowUserComponent } from '../show-user/show-user.component';

import { User } from '../shared/authentication.model';


@Component({
  selector: 'authentication-choose-user',
  templateUrl: './choose-user.component.html',
  styleUrls: ['./choose-user.component.css']
})
export class ChooseUserComponent {
  users: User[];
  @Input() showUser: Action = {
    type: <Type<Component>> ShowUserComponent,
    inputMap: { entity: 'user' },
    outputMap: { selectedEntity: 'outputSelectedUser' }
  };

  @Output() selectedUser = new EventEmitter<User>();

  outputSelectedUser(selectedUser: User) {
    this.selectedUser.emit(selectedUser);
  }
}