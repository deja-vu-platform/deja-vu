import {
  Component, ElementRef, Inject, Input, OnInit, ViewChild
} from '@angular/core';

import {
  FormBuilder, FormControl, FormGroup, FormGroupDirective,
  NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators
} from '@angular/forms';

import {
  GatewayService, GatewayServiceFactory, OnExec,
  OnExecFailure, OnExecSuccess, RunService
} from '@deja-vu/core';


import * as _ from 'lodash';

import {
  PasswordValidator, RetypePasswordValidator
} from '../shared/authentication.validation';

import { API_PATH } from '../authentication.config';


const SAVED_MSG_TIMEOUT = 3000;


@Component({
  selector: 'authentication-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: ChangePasswordComponent,
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: ChangePasswordComponent,
      multi: true
    }
  ]
})
export class ChangePasswordComponent
implements OnInit, OnExec, OnExecSuccess, OnExecFailure {
  @Input() id: string;

  @Input() inputLabel = 'Username';
  @Input() oldPasswordLabel = 'Old Password';
  @Input() passwordLabel = 'New Password';
  @Input() retypePasswordLabel = 'Retype New Password';
  @Input() buttonLabel = 'Change Password';
  @Input() newPasswordSavedText = 'Password changed';

  @ViewChild(FormGroupDirective) form;
  oldPasswordControl = new FormControl('', Validators.required);
  passwordControl = new FormControl('', PasswordValidator());
  retypePasswordControl = new FormControl('',
    RetypePasswordValidator(this.passwordControl));
  changePasswordForm: FormGroup = this.builder.group({
    oldPasswordControl: this.oldPasswordControl,
    passwordControl: this.passwordControl,
    retypePasswordControl: this.retypePasswordControl
  });

  @Input() set oldPassword(password: string) {
    this.oldPasswordControl.setValue(password);
  }

  @Input() set password(password: string) {
    this.passwordControl.setValue(password);
  }

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, private builder: FormBuilder,
    @Inject(API_PATH) private apiPath) {}

  newPasswordSaved = false;
  newPasswordSavedError: string;

  private gs: GatewayService;

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  onSubmit() {
    this.rs.exec(this.elem);
  }

  async dvOnExec(): Promise<void> {
    const res = await this.gs.post<{ data: any, errors: any }>(this.apiPath, {
        inputs: {
          input: {
            id: this.id,
            oldPassword: this.oldPasswordControl.value,
            newPassword: this.passwordControl.value
          }
        }
      })
    .toPromise();
    if (res.errors) {
      throw new Error(_.map(res.errors, 'message')
        .join());
    }
  }

  dvOnExecSuccess() {
    this.newPasswordSaved = true;
    this.newPasswordSavedError = '';
    window.setTimeout(() => {
      this.newPasswordSaved = false;
    }, SAVED_MSG_TIMEOUT);
    // Can't do `this.form.reset();`
    // See https://github.com/angular/material2/issues/4190
    if (this.form) {
      this.form.resetForm();
    }
  }

  dvOnExecFailure(reason: Error) {
    this.newPasswordSavedError = reason.message;
  }

}
