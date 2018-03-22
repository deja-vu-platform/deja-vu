import {
  Component, ElementRef, EventEmitter,
  Input, OnInit
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnAfterAbort,
  OnAfterCommit, OnRun, RunService
} from 'dv-core';

import * as _ from 'lodash';

import { User } from '../shared/authentication.model';

const SAVED_MSG_TIMEOUT = 3000;

@Component({
  selector: 'authentication-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.css']
})
export class ChangePasswordComponent implements
  OnInit, OnRun, OnAfterCommit, OnAfterAbort {
  @Input() id: string;
  @Input() oldPassword: string;
  @Input() newPassword: string;
  @Input() inputLabel = 'Username';
  @Input() oldPasswordLabel = 'Old Password';
  @Input() newPasswordLabel = 'New Password';
  @Input() buttonLabel = 'Change Password';
  @Input() newPasswordSavedText = 'Password changed';

  newPasswordSaved = false;
  newPasswordSavedError: string;

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
      query: `mutation ChangePassword($input: ChangePasswordInput!) {
        changePassword(input: $input)
      }`, variables: {
        input: {
          id: this.id,
          oldPassword: this.oldPassword,
          newPassword: this.newPassword
        }
      }
    })
      .toPromise();
  }

  dvOnAfterCommit() {
    this.newPasswordSaved = true;
    window.setTimeout(() => {
      this.newPasswordSaved = false;
    }, SAVED_MSG_TIMEOUT);
  }

  dvOnAfterAbort(reason: Error) {
    this.newPasswordSavedError = reason.message;
  }

}
