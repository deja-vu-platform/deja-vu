import {
  Component, ElementRef, EventEmitter,
  Input, OnInit, Output
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnAfterAbort,
  OnAfterCommit, OnRun, RunService
} from 'dv-core';

import * as _ from 'lodash';

import { User } from '../shared/authentication.model';

const SAVED_MSG_TIMEOUT = 3000;

@Component({
  selector: 'authentication-register-user',
  templateUrl: './register-user.component.html',
  styleUrls: ['./register-user.component.css']
})
export class RegisterUserComponent implements
  OnInit, OnRun, OnAfterCommit, OnAfterAbort {
  @Input() id: string;
  @Input() password: string;
  @Input() href: string; // To log in page
  @Input() inputLabel = 'Username';
  @Input() passwordLabel = 'Password';
  @Input() newUserRegisteredText = 'New user registered';

  @Output() user = new EventEmitter();

  newUserRegistered = false;
  newUserRegisteredError: string;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  onSubmit() {
    this.rs.run(this.elem);
  }

  async dvOnRun(): Promise<void> {
    const res = await this.gs.post<{ data: any }>('/graphql', {
      query: `mutation RegisterUser($input: RegisterUserInput!) {
        registerUser(input: $input) {
          id
        }
      }`, variables: {
        input: {
          id: this.id,
          password: this.password
        }
      }
    })
      .toPromise();
    this.user.emit({ id: res.data.registerUser.id });
  }

  dvOnAfterCommit() {
    this.newUserRegistered = true;
    window.setTimeout(() => {
      this.newUserRegistered = false;
    }, SAVED_MSG_TIMEOUT);
  }

  dvOnAfterAbort(reason: Error) {
    this.newUserRegisteredError = reason.message;
  }

}
