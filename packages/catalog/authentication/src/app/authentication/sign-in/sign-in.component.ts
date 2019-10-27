import {
  Component, ElementRef, EventEmitter, Inject, Input, OnInit, Output, ViewChild
} from '@angular/core';

import {
  FormBuilder, FormControl, FormGroup, FormGroupDirective, Validators
} from '@angular/forms';

import {
  DvService, DvServiceFactory, OnExec, OnExecFailure, OnExecSuccess
} from '@deja-vu/core';

import * as _ from 'lodash';

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

  @Input() set username(username: string) {
    this.usernameControl.setValue(username);
  }

  @Input() set password(password: string) {
    this.passwordControl.setValue(password);
  }

  private dvs: DvService;

  constructor(
    private readonly elem: ElementRef, private readonly dvf: DvServiceFactory,
    private readonly builder: FormBuilder,
    @Inject(API_PATH) private readonly apiPath) {}

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .build();
  }

  onSubmit() {
    this.dvs.exec();
  }

  async dvOnExec(): Promise<void> {
    const res = await this.dvs.gateway.post<{ data: any, errors: any }>(
      this.apiPath, {
        inputs: {
          input: {
            username: this.usernameControl.value,
            password: this.passwordControl.value
          }
        },
        extraInfo: {
          returnFields: `
            token,
            user { id, username }
          `
        }
      })
      .toPromise();
    if (res.errors) {
      throw new Error(_.map(res.errors, 'message')
        .join());
    }

    const token = res.data.signIn.token;
    const user = res.data.signIn.user;
    this.dvs.setItem('token', token);
    this.dvs.setItem('user', user);
    this.user.emit(user);
  }

  dvOnExecSuccess() {
    this.newUserSignedIn = true;
    this.newUserSignedInError = '';
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
