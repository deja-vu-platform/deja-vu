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
  // tslint:disable-next-line:component-selector
  selector: 'authentication-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.css']
})
export class SignInComponent implements
  OnInit, OnRun, OnAfterCommit, OnAfterAbort {
  @Input() id: string;
  @Input() password: string;
  @Input() href: string;
  @Input() inputLabel = 'Username';
  @Input() passwordLabel = 'Password';
  @Input() newUserSignedInText = 'User signed in';

  @Output() user = new EventEmitter();

  newUserSignedIn = false;
  newUserSignedInError: string;

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
      query: `mutation SignInUser($input: SignInUserInput!) {
        signInUser(input: $input) {
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

    const userId = this.setTokens(res.data.signIn);
    this.user.emit({ id: userId });
  }

  setTokens(data) {
    const authToken = JSON.parse(data);
    const token = authToken.token;
    const userId = authToken.user.id;
    localStorage.setItem('id_token', token);
    localStorage.setItem('user_id', userId);

    return userId;
  }

  dvOnAfterCommit() {
    this.newUserSignedIn = true;
    window.setTimeout(() => {
      this.newUserSignedIn = false;
    }, SAVED_MSG_TIMEOUT);
  }

  dvOnAfterAbort(reason: Error) {
    this.newUserSignedInError = reason.message;
  }

}
