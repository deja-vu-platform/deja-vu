import {
  Component, ElementRef, EventEmitter, Inject, Input, OnInit, Output, ViewChild
} from '@angular/core';

import {
  FormBuilder, FormControl, FormGroup, FormGroupDirective, Validators
} from '@angular/forms';

import {
  GatewayService, GatewayServiceFactory, OnExec, OnExecFailure,
  OnExecSuccess, RunService
} from '@deja-vu/core';


import * as _ from 'lodash';

import { API_PATH } from '../passkey.config';
import { Passkey, SignInOutput } from '../shared/passkey.model';
import { PasskeyService } from '../shared/passkey.service';

const SAVED_MSG_TIMEOUT = 3000;

interface ValidatePasskeyRes {
  data: { validatePasskey: SignInOutput };
  errors: { message: string }[];
}

@Component({
  selector: 'passkey-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.css']
})
export class SignInComponent
  implements OnInit, OnExec, OnExecSuccess, OnExecFailure {
  // Presentation inputs
  @Input() inputLabel = 'Passkey Code';
  @Input() buttonLabel = 'Validate';
  @Input() passkeyValidatedText = 'Passkey validated';

  @Input() showOptionToSubmit = true;

  @Input() setPasskey = true;

  @Output() passkey = new EventEmitter<Passkey>();

  @ViewChild(FormGroupDirective) form;

  passkeyControl = new FormControl('', Validators.required);
  validatePasskeyForm: FormGroup = this.builder.group({
    passkeyControl: this.passkeyControl
  });

  @Input() set code(code: string) {
    if (!_.isNil(code)) { this.passkeyControl.setValue(code); }
  }

  passkeyValidated = false;
  passkeyValidatedError: string;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, private builder: FormBuilder,
    private passkeyService: PasskeyService,
    @Inject(API_PATH) private apiPath) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  onSubmit() {
    this.rs.exec(this.elem);
  }

  async dvOnExec(): Promise<void> {
    const res = await this.gs.post<ValidatePasskeyRes>(this.apiPath, {
      inputs: { code: this.passkeyControl.value },
      extraInfo: {
        returnFields: `
          passkey { id, code }
          token
        `
      }
    })
      .toPromise();

    if (res.errors) {
      throw new Error(_.map(res.errors, 'message')
        .join());
    }

    const token = res.data.validatePasskey.token;
    const passkey = res.data.validatePasskey.passkey;
    if (this.setPasskey) {
      this.passkeyService.setSignedInPasskey(token, passkey);
    }

    this.passkey.emit(passkey);
  }

  dvOnExecSuccess() {
    this.passkeyValidated = true;
    window.setTimeout(() => {
      this.passkeyValidated = false;
    }, SAVED_MSG_TIMEOUT);
    // Can't do `this.form.reset();`
    // See https://github.com/angular/material2/issues/4190
    if (this.form) {
      this.form.resetForm();
    }
  }

  dvOnExecFailure(reason: Error) {
    this.passkeyValidatedError = reason.message;
  }
}
