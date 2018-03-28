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
  selector: 'authentication-register-user',
  templateUrl: './register-user.component.html',
  styleUrls: ['./register-user.component.css']
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
  usernameControl = new FormControl('', Validators.required);
  passwordControl = new FormControl('', Validators.required);
  retypePasswordControl = new FormControl('', Validators.required);
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
    private rs: RunService, private builder: FormBuilder) {}

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
        register(input: $input) {
          id
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
    this.user.emit({ id: res.data.register.id });
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
