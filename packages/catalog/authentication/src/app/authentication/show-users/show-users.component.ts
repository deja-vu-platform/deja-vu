import {
  Component,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  OnChanges,
  OnInit,
  Output,
  Type,
  ViewChild
} from '@angular/core';

import {
  Action,
  GatewayService, GatewayServiceFactory
} from 'dv-core';

import { User } from '../shared/authentication.model';
import { ShowUserComponent } from '../show-user/show-user.component';

import { API_PATH } from '../authentication.config';


@Component({
  selector: 'authentication-show-users',
  templateUrl: './show-users.component.html',
  styleUrls: ['./show-users.component.css']
})
export class ShowUsersComponent implements OnInit, OnChanges {
  @Input() showUsername = true;
  @Input() showId = true;

  @Input() showUser: Action = {
    type: <Type<Component>> ShowUserComponent
  };
  @Input() noUsersToShowText = 'No users to show';
  users: User[] = [];

  @Output() fetchedUsers = new EventEmitter<User[]>();

  showUsers;
  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    @Inject(API_PATH) private apiPath) {
    this.showUsers = this;
  }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.fetchUsers();
  }

  ngOnChanges() {
    this.fetchUsers();
  }

  fetchUsers() {
    if (this.gs) {
      this.gs
        .get<{ data: { users: User[] } }>(this.apiPath, {
          params: {
            query: `
              query Users($input: UsersInput!) {
                users(input: $input) {
                  ${this.showId ? 'id' : ''}
                  ${this.showUsername ? 'username' : ''}
                }
              }
            `,
            variables: JSON.stringify({
              input: {
              }
            })
          }
        })
        .subscribe((res) => {
          this.users = res.data.users;
          this.fetchedUsers.emit(this.users);
        });
    }
  }
}
