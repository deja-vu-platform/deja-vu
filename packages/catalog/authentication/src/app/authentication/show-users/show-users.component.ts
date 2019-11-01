import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject,
  Input, OnChanges, OnInit, Output, Type
} from '@angular/core';

import {
  ComponentValue, DvService, DvServiceFactory, OnEval
} from '@deja-vu/core';

import { User } from '../shared/authentication.model';
import { ShowUserComponent } from '../show-user/show-user.component';

import { API_PATH } from '../authentication.config';

import * as _ from 'lodash';


@Component({
  selector: 'authentication-show-users',
  templateUrl: './show-users.component.html',
  styleUrls: ['./show-users.component.css']
})
export class ShowUsersComponent
  implements AfterViewInit, OnEval, OnInit, OnChanges {
  @Input() showUsername = true;
  @Input() showId = true;

  @Input() showUser: ComponentValue = {
    type: <Type<Component>> ShowUserComponent
  };
  @Input() noUsersToShowText = 'No users to show';
  users: User[] = [];

  @Output() fetchedUsers = new EventEmitter<User[]>();
  @Output() fetchedUserIds = new EventEmitter<string[]>();

  showUsers;

  private dvs: DvService;

  constructor(
    private readonly elem: ElementRef, private readonly dvf: DvServiceFactory,
    @Inject(API_PATH) private readonly apiPath) {
    this.showUsers = this;
  }

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .build();
  }

  ngAfterViewInit() {
    this.load();
  }

  ngOnChanges() {
    this.load();
  }

  load() {
    if (this.canEval()) {
      this.dvs.eval();
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      const res = await this.dvs.gateway.get<{ data: { users: User[] } }>(
        this.apiPath, {
          params: {
            inputs: JSON.stringify({
              input: {}
            }),
            extraInfo: {
              returnFields: `
                ${this.showId ? 'id' : ''}
                ${this.showUsername ? 'username' : ''}
              `
            }
          }
        })
        .toPromise();
      this.users = res.data.users;
      this.fetchedUsers.emit(this.users);
      this.fetchedUserIds.emit(_.map(this.users, 'id'));
    } else if (this.dvs) {
      this.dvs.gateway.noRequest();
    }
  }

  private canEval(): boolean {
    return !!(this.dvs);
  }
}
