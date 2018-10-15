import {
  Component, ElementRef, EventEmitter, Inject, Input, OnInit, Output, ViewChild
} from '@angular/core';

import {
  FormBuilder, FormControl, FormGroup, FormGroupDirective,
  NG_VALIDATORS, NG_VALUE_ACCESSOR
} from '@angular/forms';

import {
  GatewayService, GatewayServiceFactory, OnAfterAbort,
  OnAfterCommit, OnRun, RunService
} from 'dv-core';

import * as _ from 'lodash';

import { API_PATH } from '../passkey.config';
import { Passkey, SignInOutput } from '../shared/passkey.model';
import { PasskeyService } from '../shared/passkey.service';
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
  implements OnInit, OnRun, OnAfterCommit, OnAfterAbort {

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
    this.rs.run(this.elem);
  }

  async dvOnRun(): Promise<void> {
    let passkey;
    if (this.signIn) {
      const res = await this.gs
        .post<CreateAndValidatePasskeyRes>(this.apiPath, {
          query: `mutation {
          createAndValidatePasskey(code: "${this.passkeyControl.value}") {
            passkey { code }
            token
          }
        }`
        })
        .toPromise();

      if (res.errors) {
        throw new Error(_.map(res.errors, 'message')
          .join());
      }

      const token = res.data.createAndValidatePasskey.token;
      passkey = res.data.createAndValidatePasskey.passkey;
      this.passkeyService.setSignedInPasskey(token, passkey);

    } else {
      const res = await this.gs.post<CreatePasskeyRes>(this.apiPath, {
        query: `mutation {
          createPasskey(code: "${this.passkeyControl.value}") {
            code
          }
        }`
      })
        .toPromise();

      if (res.errors) {
        throw new Error(_.map(res.errors, 'message')
          .join());
      }

      passkey = res.data.createPasskey;
    }
    this.passkey.emit(passkey);
  }

  dvOnAfterCommit() {
    this.newPasskeyCreated = true;
    window.setTimeout(() => {
      this.newPasskeyCreated = false;
      this.newPasskeyError = '';
    }, SAVED_MSG_TIMEOUT);
    // Can't do `this.form.reset();`
    // See https://github.com/angular/material2/issues/4190
    if (this.form) {
      this.form.resetForm();
    }
  }

  dvOnAfterAbort(reason: Error) {
    this.newPasskeyError = reason.message;
  }
}
