import { Component, EventEmitter, Input, Output, Type } from '@angular/core';

import { Action } from '@dejavu-lang/core';

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
    type: <Type<Component>>ShowUserComponent,
    inputMap: { entity: 'user' }
  };

  @Input() showChooseButton = true;
  @Input() chooseSelectPlaceholder = 'Choose User';
  @Input() addButtonLabel = 'Add User';

  @Output() selectedUser = new EventEmitter<User>();

  outputSelectedUser(selectedUser: User) {
    this.selectedUser.emit(selectedUser);
  }
}
