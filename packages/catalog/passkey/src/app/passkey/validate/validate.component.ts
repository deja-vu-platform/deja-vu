import {
  Component, ElementRef, Inject, Input, OnChanges, OnInit
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnExec, RunService
} from '@deja-vu/core';

import * as _ from 'lodash';

import { API_PATH } from '../passkey.config';
import { PasskeyService } from '../shared/passkey.service';

interface VerifyRes {
  data: { verify: boolean };
  errors: { message: string }[];
}

@Component({
  selector: 'passkey-validate',
  templateUrl: './validate.component.html',
  styleUrls: ['./validate.component.css']
})
export class ValidateComponent implements OnExec, OnInit, OnChanges {
  isValidated = false;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, private passkeyService: PasskeyService,
    @Inject(API_PATH) private apiPath) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
    this.load();
  }

  ngOnChanges() {
    this.load();
  }

  load() {
    if (!this.gs) {
      return;
    }

    const code = this.passkeyService.getSignedInPasskey();
    const token = this.passkeyService.getToken();

    if (!code || !token) {
      return;
    }

    this.gs.get<VerifyRes>(this.apiPath, {
      params: {
        inputs: JSON.stringify({
          input: {
            code: code,
            token: token
          }
        })
      }
    })
    .subscribe((res) => {
      this.isValidated = res.data.verify;
    });
  }

  dvOnExec() {
    this.load();
  }
}
