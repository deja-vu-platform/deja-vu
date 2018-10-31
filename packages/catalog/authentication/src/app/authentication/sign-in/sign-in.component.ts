import {
  Component, ElementRef, EventEmitter, Inject, Input, OnInit, Output, ViewChild
} from '@angular/core';

import {
  AbstractControl, FormBuilder, FormControl, FormGroup, FormGroupDirective,
  Validators
} from '@angular/forms';

import {
  GatewayService, GatewayServiceFactory, OnExecFailure,
  OnExecSuccess, OnExec, RunService
} from 'dv-core';


import * as _ from 'lodash';

import { AuthenticationService } from '../shared/authentication.service';

import { User } from '../shared/authentication.model';

import { API_PATH } from '../authentication.config';


const SAVED_MSG_TIMEOUT = 3000;


@Component({
  selector: 'authentication-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.css']
})
export class SignInComponent
implements OnInit, OnExec, OnExecSuccess, OnExecFailure {
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
    private rs: RunService, private builder: FormBuilder,
    private authenticationService: AuthenticationService,
    @Inject(API_PATH) private apiPath) {}

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  onSubmit() {
    this.rs.exec(this.elem);
  }

  async dvOnExec(): Promise<void> {
    const res = await this.gs.post<{ data: any, errors: any }>(this.apiPath, {
      query: `mutation SignIn($input: SignInInput!) {
        signIn(input: $input) {
          token,
          user { id, username }
        }
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

    const token = res.data.signIn.token;
    const user = res.data.signIn.user;
    this.authenticationService.setSignedInUser(token, user);
    this.user.emit(user);
  }

  setTokens(token: string, user: User) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    return user;
  }

  dvOnExecSuccess() {
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

  dvOnExecFailure(reason: Error) {
    this.newUserSignedInError = reason.message;
  }
}
