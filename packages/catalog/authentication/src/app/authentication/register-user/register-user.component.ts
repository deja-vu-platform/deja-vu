import {
  Component, ElementRef, EventEmitter, Inject, Input, OnInit, Output, ViewChild
} from '@angular/core';

import {
  FormBuilder, FormControl, FormGroup, FormGroupDirective,
  NG_VALIDATORS, NG_VALUE_ACCESSOR
} from '@angular/forms';

import {
  DvService, DvServiceFactory, OnExec, OnExecFailure, OnExecSuccess
} from '@deja-vu/core';

import * as _ from 'lodash';

import {
  PasswordValidator, RetypePasswordValidator, UsernameValidator
} from '../shared/authentication.validation';

import { API_PATH } from '../authentication.config';


const SAVED_MSG_TIMEOUT = 3000;


@Component({
  selector: 'authentication-register-user',
  templateUrl: './register-user.component.html',
  styleUrls: ['./register-user.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: RegisterUserComponent,
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: RegisterUserComponent,
      multi: true
    }
  ]
})
export class RegisterUserComponent
  implements OnInit, OnExec, OnExecSuccess, OnExecFailure {
  @Input() id: string;

  @Input() inputLabel = 'Username';
  @Input() passwordLabel = 'Password';
  @Input() retypePasswordLabel = 'Retype Password';
  @Input() buttonLabel = 'Register User';
  @Input() newUserRegisteredText = 'New user registered';
  @Input() showOptionToSubmit = true;
  @Input() signIn = true;

  @Output() user = new EventEmitter();

  @ViewChild(FormGroupDirective) form;
  usernameControl = new FormControl('', UsernameValidator());
  passwordControl = new FormControl('', PasswordValidator());
  retypePasswordControl = new FormControl('',
    RetypePasswordValidator(this.passwordControl));
  registerForm: FormGroup = this.builder.group({
    usernameControl: this.usernameControl,
    passwordControl: this.passwordControl,
    retypePasswordControl: this.retypePasswordControl
  });

  newUserRegistered = false;
  newUserRegisteredError: string;

  @Input() set username(username: string) {
    this.usernameControl.setValue(username);
  }

  @Input() set password(password: string) {
    this.passwordControl.setValue(password);
  }

  private dvs: DvService;

  private static ErrorsToMsg(errors: { message: string }[])  {
    return _.map(errors, 'message')
      .join();
  }

  constructor(
    private readonly elem: ElementRef, private readonly dvf: DvServiceFactory,
    private readonly builder: FormBuilder,
    @Inject(API_PATH) private readonly apiPath) { }

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .build();
  }

  onSubmit() {
    this.dvs.exec();
  }

  private throwErrors(errors: { message: string }[]) {
    throw new Error(RegisterUserComponent.ErrorsToMsg(errors));
  }

  async dvOnExec(): Promise<void> {
    if (this.passwordControl.value !== this.retypePasswordControl.value) {
      throw new Error('Passwords do not match.');
    }

    const inputs = {
      input: {
        id: this.id,
        username: this.usernameControl.value,
        password: this.passwordControl.value
      }
    };
    let user;
    if (this.signIn) {
      const res = await this.dvs.gateway.post<{ data: any, errors: any }>(
        this.apiPath, {
          inputs: inputs,
          extraInfo: {
            action: 'login',
            returnFields: `
              user { id, username }
              token
            `
          }
        })
        .toPromise();

      if (res.errors) {
        this.throwErrors(res.errors);
      }

      const token = res.data.registerAndSignIn.token;
      user = res.data.registerAndSignIn.user;
      this.dvs.setItem('token', token);
      this.dvs.setItem('user', user);

    } else {
      const res = await this.dvs.gateway.post<{ data: any, errors: any }>(
        this.apiPath, {
          inputs: inputs,
          extraInfo: {
            action: 'register-only',
            returnFields: `
              id,
              username
            `
          }
        })
        .toPromise();

      if (res.errors) {
        this.throwErrors(res.errors);
      }
      user = res.data.register;
    }
    this.user.emit(user);
  }

  dvOnExecSuccess() {
    this.newUserRegistered = true;
    this.newUserRegisteredError = '';
    window.setTimeout(() => {
      this.newUserRegistered = false;
    }, SAVED_MSG_TIMEOUT);
    // Can't do `this.form.reset();`
    // See https://github.com/angular/material2/issues/4190
    if (this.form) {
      this.form.resetForm();
    }
  }

  dvOnExecFailure(reason: Error) {
    try {
      const msg = JSON.parse(reason.message);
      this.newUserRegisteredError = RegisterUserComponent
        .ErrorsToMsg(_.get(msg, 'errors'));
    } catch (e) {
      this.newUserRegisteredError = reason.message;
    }
  }
}
