import {
  Component, ElementRef, EventEmitter, Inject, Input, OnInit
} from '@angular/core';

import {
  GatewayService, GatewayServiceFactory, OnAfterAbort, OnAfterCommit, OnRun,
  RunService
} from 'dv-core';

import * as _ from 'lodash';

import { API_PATH } from '../market.config';


const SAVED_MSG_TIMEOUT = 3000;

@Component({
  selector: 'market-cancel-compound-transaction',
  templateUrl: './cancel-compound-transaction.component.html',
  styleUrls: ['./cancel-compound-transaction.component.css'],
})
export class CancelCompoundTransactionComponent implements
  OnInit, OnRun, OnAfterCommit, OnAfterAbort  {
  @Input() id;

    // Presentation inputs
  @Input() buttonLabel = 'Cancel';
  @Input() canceledText = 'Transaction canceled';


  canceled = false;
  cancelErrorText: string;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, @Inject(API_PATH) private apiPath) {}

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  onClick() {
    this.rs.run(this.elem);
  }

  async dvOnRun(): Promise<void> {
    const res = await this.gs
      .post<{data: any, errors: {message: string}[]}>(this.apiPath, {
        query: `mutation {
          cancelCompoundTransaction(id: "${this.id}")
        }`
      })
      .toPromise();

    if (res.errors) {
      throw new Error(_.map(res.errors, 'message')
        .join());
    }
  }

  dvOnAfterCommit() {
    this.canceled = true;
    this.cancelErrorText = '';
    window.setTimeout(() => {
      this.canceled = false;
    }, SAVED_MSG_TIMEOUT);
  }

  dvOnAfterAbort(reason: Error) {
    this.cancelErrorText = reason.message;
  }
}
