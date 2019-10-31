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

import { API_PATH } from '../passkey.config';
import { Passkey, SignInOutput } from '../shared/passkey.model';
import { PasskeyValidator } from '../shared/passkey.validation';

const SAVED_MSG_TIMEOUT = 3000;

interface CreateAndValidatePasskeyRes {
  data: { createAndValidatePasskey: SignInOutput };
  errors: { message: string }[];
}

interface CreatePasskeyRes {
  data: { createPasskey: Passkey };
  errors: { message: string }[];
}

@Component({
  selector: 'passkey-create-passkey',
  templateUrl: './create-passkey.component.html',
  styleUrls: ['./create-passkey.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: CreatePasskeyComponent,
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: CreatePasskeyComponent,
      multi: true
    }
  ]
})
export class CreatePasskeyComponent
  implements OnInit, OnExec, OnExecSuccess, OnExecFailure {
  @Input() id: string | undefined;

  // Presentation options
  @Input() randomPassword = false;
  @Input() signIn = true;
  @Input() showOptionToSubmit = true;

  // Presentation text
  @Input() inputLabel = 'Passkey';
  @Input() buttonLabel = this.randomPassword ?
    'Generate Random Passkey' : 'Create Passkey';
  @Input() newPasskeyCreatedText = 'New passkey created';

  @Output() passkey = new EventEmitter<Passkey>();

  @ViewChild(FormGroupDirective) form;
  passkeyControl = new FormControl('', PasskeyValidator());
  createPasskeyForm: FormGroup = this.builder.group({
    passkeyControl: this.passkeyControl
  });

  @Input() set code(code: string) {
    if (code) { this.passkeyControl.setValue(code); }
  }

  newPasskeyCreated = false;
  newPasskeyError: string;

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
    const inputs = {
      input: {
        id: this.id,
        code: this.passkeyControl.value
      }
    };
    let passkey;
    if (this.signIn) {
      const res = await this.dvs
        .post<CreateAndValidatePasskeyRes>(this.apiPath, {
          inputs: inputs,
          extraInfo: {
            action: 'login',
            returnFields: `
              passkey { id, code }
              token
            `
          }
        });

      if (res.errors) { this.throwErrors(res.errors); }

      const token = res.data.createAndValidatePasskey.token;
      passkey = res.data.createAndValidatePasskey.passkey;
      this.dvs.setItem('token', token);
      this.dvs.setItem('passkey', passkey);

    } else {
      const res = await this.dvs.post<CreatePasskeyRes>(this.apiPath, {
        inputs: inputs,
        extraInfo: {
          action: 'register-only',
          returnFields: `
            id,
            code
          `
        }
      });

      if (res.errors) { this.throwErrors(res.errors); }

      passkey = res.data.createPasskey;
    }
    this.passkey.emit(passkey);
  }

  dvOnExecSuccess() {
    this.newPasskeyCreated = true;
    this.newPasskeyError = '';
    window.setTimeout(() => {
      this.newPasskeyCreated = false;
    }, SAVED_MSG_TIMEOUT);
    // Can't do `this.form.reset();`
    // See https://github.com/angular/material2/issues/4190
    if (this.form) {
      this.form.resetForm();
    }
  }

  dvOnExecFailure(reason: Error) {
    this.newPasskeyError = reason.message;
  }

  private throwErrors(errors: any) {
    throw new Error(_.map(errors, 'message')
      .join());
  }
}
