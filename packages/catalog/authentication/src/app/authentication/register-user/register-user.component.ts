import {
  Component, ElementRef, EventEmitter, Inject, Input, OnInit, Output, ViewChild
} from '@angular/core';

import {
  FormBuilder, FormControl, FormGroup, FormGroupDirective,
  NG_VALIDATORS, NG_VALUE_ACCESSOR
} from '@angular/forms';

import {
  GatewayService, GatewayServiceFactory, OnExecFailure,
  OnExecSuccess, OnExec, RunService
} from 'dv-core';

import * as _ from 'lodash';

import { AuthenticationService } from '../shared/authentication.service';

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
    @Inject(API_PATH) private apiPath) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  onSubmit() {
    this.rs.exec(this.elem);
  }

  private throwErrors(errors: any) {
    throw new Error(_.map(errors, 'message')
      .join());
  }

  async dvOnExec(): Promise<void> {
    const variables = {
      input: {
        id: this.id,
        username: this.usernameControl.value,
        password: this.passwordControl.value
      }
    };
    let user;
    if (this.signIn) {
      const res = await this.gs.post<{ data: any, errors: any }>(this.apiPath, {
        query: `mutation RegisterAndSignIn($input: RegisterInput!) {
          registerAndSignIn(input: $input) {
            user { id, username }
            token
          }
        }`,
        variables: variables
      })
      .toPromise();

      if (res.errors) this.throwErrors(res.errors);

      const token = res.data.registerAndSignIn.token;
      user = res.data.registerAndSignIn.user;
      this.authenticationService.setSignedInUser(token, user);

    } else {
      const res = await this.gs.post<{ data: any, errors: any }>(this.apiPath, {
        query: `mutation Register($input: RegisterInput!) {
          register(input: $input) {
            id,
            username
          }
        }`,
        variables: variables
      })
      .toPromise();

      if (res.errors) this.throwErrors(res.errors);

      user = res.data.register;
    }
    this.user.emit(user);
  }

  dvOnExecSuccess() {
    this.newUserRegistered = true;
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
    this.newUserRegisteredError = reason.message;
  }
}
