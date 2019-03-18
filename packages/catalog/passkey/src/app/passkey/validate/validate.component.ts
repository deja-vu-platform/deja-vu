import {
  Component, ElementRef, Inject, Input, OnChanges, OnInit
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnExec, RunService, StorageService
} from '@deja-vu/core';

import * as _ from 'lodash';

import { API_PATH } from '../passkey.config';

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
  @Input() code: string;

  isValidated = false;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, private ss: StorageService,
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
    this.doRequest();
  }

  dvOnExec() {
    this.doRequest();
  }

  doRequest() {
    if (!this.gs || _.isEmpty(this.code)) {
      return;
    }

    const token = this.ss.getItem(this.elem, 'token');

    this.gs.get<VerifyRes>(this.apiPath, {
      params: {
        inputs: {
          input: {
            code: this.code,
            token: token
          }
        }
      }
    })
      .subscribe((res) => {
        this.isValidated = res.data.verify;
      });
  }
}
