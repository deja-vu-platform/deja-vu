import {
  Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild
} from '@angular/core';

import {
  AbstractControl, FormBuilder, FormControl, FormGroup, FormGroupDirective,
  Validators
} from '@angular/forms';

import {
  GatewayService, GatewayServiceFactory, OnAfterAbort,
  OnAfterCommit, OnRun, RunService
} from 'dv-core';


import * as _ from 'lodash';

import { User } from '../shared/authentication.model';

const SAVED_MSG_TIMEOUT = 3000;

@Component({
  selector: 'authentication-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.css']
})
export class SignInComponent
implements OnInit, OnRun, OnAfterCommit, OnAfterAbort {
  @Input() id: string;

  @Input() inputLabel = 'Username';
  @Input() passwordLabel = 'Password';
  @Input() buttonLabel = 'Sign In';
  @Input() newUserSignedInText = 'User signed in';

  @Output() user = new EventEmitter();

  @ViewChild(FormGroupDirective) form;

  usernameControl = new FormControl('', Validators.required);
  passwordControl = new FormControl('', Validators.required);
  signInForm: FormGroup = this.builder.group({
    usernameControl: this.usernameControl,
    passwordControl: this.passwordControl
  });

  newUserSignedIn = false;
  newUserSignedInError: string;

  private gs: GatewayService;

  @Input() set username(username: string) {
    this.usernameControl.setValue(username);
  }

  @Input() set password(password: string) {
    this.passwordControl.setValue(password);
  }

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, private builder: FormBuilder) {}

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  onSubmit() {
    this.rs.run(this.elem);
  }

  async dvOnRun(): Promise<void> {
    const res = await this.gs.post<{ data: any, errors: any }>('/graphql', {
      query: `mutation SignIn($input: SignInInput!) {
        signIn(input: $input)
      }`,
      variables: {
        input: {
          username: this.usernameControl.value,
          password: this.passwordControl.value
        }
      }
    })
    .toPromise();
    if (res.errors) {
      throw new Error(_.map(res.errors, 'message')
        .join());
    }

    const user = this.setTokens(res.data.signIn);
    this.user.emit(user);
  }

  setTokens(data) {
    const authToken = JSON.parse(data);
    const token = authToken.token;
    const user = authToken.user;
    localStorage.setItem('id_token', token);
    localStorage.setItem('user', JSON.stringify(user));

    return user;
  }

  dvOnAfterCommit() {
    this.newUserSignedIn = true;
    window.setTimeout(() => {
      this.newUserSignedIn = false;
    }, SAVED_MSG_TIMEOUT);
    // Can't do `this.form.reset();`
    // See https://github.com/angular/material2/issues/4190
    if (this.form) {
      this.form.resetForm();
    }
  }

  dvOnAfterAbort(reason: Error) {
    this.newUserSignedInError = reason.message;
  }

}
