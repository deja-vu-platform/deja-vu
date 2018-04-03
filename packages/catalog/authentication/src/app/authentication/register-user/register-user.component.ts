import {
  Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild
} from '@angular/core';

import {
  AbstractControl, FormBuilder, FormControl, FormGroup, FormGroupDirective,
  NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, ValidatorFn, Validators
} from '@angular/forms';

import {
  GatewayService, GatewayServiceFactory, OnAfterAbort,
  OnAfterCommit, OnRun, RunService
} from 'dv-core';

import * as _ from 'lodash';

import { AuthenticationService } from '../shared/authentication.service';

import { User } from '../shared/authentication.model';
import { passwordMatchValidator } from '../shared/password.match.validator';

const SAVED_MSG_TIMEOUT = 3000;
const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 15;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 20;

// Also signs in the user
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
  implements OnInit, OnRun, OnAfterCommit, OnAfterAbort {
  @Input() id: string;

  @Input() inputLabel = 'Username';
  @Input() passwordLabel = 'Password';
  @Input() retypePasswordLabel = 'Retype Password';
  @Input() buttonLabel = 'Register User';
  @Input() newUserRegisteredText = 'New user registered';

  @Output() user = new EventEmitter();

  @ViewChild(FormGroupDirective) form;
  usernameControl = new FormControl('', [
    Validators.required,
    Validators.minLength(USERNAME_MIN_LENGTH),
    Validators.maxLength(USERNAME_MAX_LENGTH),
    Validators.pattern('^(?![_.-])(?!.*[_.-]{2})[a-zA-Z0-9._-]+$')]
  );
  passwordControl = new FormControl('', [
    Validators.required,
    Validators.minLength(PASSWORD_MIN_LENGTH),
    Validators.maxLength(PASSWORD_MAX_LENGTH),
    // tslint:disable-next-line:max-line-length
    Validators.pattern('^.*(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?!.*[`~()\-_=+[{\]}\\|;:\'",.<>/? ]).*$')
  ]);
  retypePasswordControl = new FormControl('', [
    Validators.required,
    passwordMatchValidator(() => this.passwordControl.value)
  ]);
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
    private authenticationService: AuthenticationService) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  onSubmit() {
    this.rs.run(this.elem);
  }

  async dvOnRun(): Promise<void> {
    const res = await this.gs.post<{ data: any }>('/graphql', {
      query: `mutation Register($input: RegisterInput!) {
        registerAndSignIn(input: $input) {
          user { id, username }
          token
        }
      }`,
      variables: {
        input: {
          id: this.id,
          username: this.usernameControl.value,
          password: this.passwordControl.value
        }
      }
    })
      .toPromise();

    const token = res.data.registerAndSignIn.token;
    const user = res.data.registerAndSignIn.user;
    this.authenticationService.setSignedInUser(token, user);
    this.user.emit({ id: res.data.registerAndSignIn.id });
  }

  dvOnAfterCommit() {
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

  dvOnAfterAbort(reason: Error) {
    this.newUserRegisteredError = reason.message;
  }
}
