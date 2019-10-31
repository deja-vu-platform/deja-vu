import {
  AfterViewInit, Component, ElementRef, Inject, Input, OnChanges, OnInit
} from '@angular/core';
import { DvService, DvServiceFactory, OnExec } from '@deja-vu/core';

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
export class ValidateComponent
  implements AfterViewInit, OnExec, OnInit, OnChanges {
  @Input() code: string;

  isValidated = false;

  private dvs: DvService;

  constructor(
    private readonly elem: ElementRef, private readonly dvf: DvServiceFactory,
    @Inject(API_PATH) private readonly apiPath) {}

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .build();
  }

  ngAfterViewInit() {
    this.load();
  }

  ngOnChanges() {
    this.load();
  }

  load() {
    this.doRequest();
  }

  async dvOnExec() {
    await this.doRequest();
  }

  async doRequest() {
    if (!this.dvs || _.isEmpty(this.code)) {
      return;
    }

    const token = this.dvs.getItem('token');

    const res = await this.dvs.get<VerifyRes>(this.apiPath, {
      params: {
        inputs: JSON.stringify({
          input: {
            code: this.code,
            token: token
          }
        })
      }
    });
    this.isValidated = res.data.verify;
  }
}
