import {
  Component, ElementRef, EventEmitter, Inject, Input, OnInit
} from '@angular/core';

import {
  GatewayService, GatewayServiceFactory, OnAfterAbort, OnAfterCommit, OnRun,
  RunService
} from 'dv-core';

import * as _ from 'lodash';

import { API_PATH } from '../market.config';

interface PayCompoundTransactionRes {
  data: { payCompoundTransaction: boolean },
  errors: { message: string }[]
}

const SAVED_MSG_TIMEOUT = 3000;

@Component({
  selector: 'market-pay-compound-transaction',
  templateUrl: './pay-compound-transaction.component.html',
  styleUrls: ['./pay-compound-transaction.component.css'],
})
export class PayCompoundTransactionComponent implements
  OnInit, OnRun, OnAfterCommit, OnAfterAbort  {
  @Input() id;

  // Presentation inputs
  @Input() buttonLabel = 'Pay';
  @Input() paidText = 'Transaction paid!';


  paid = false;
  payErrorText: string;

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
    const res = await this.gs.post<PayCompoundTransactionRes>(this.apiPath, {
      query: `mutation {
        payCompoundTransaction(id: "${this.id}")
      }`
    })
    .toPromise();

    if (res.errors) {
      throw new Error(_.map(res.errors, 'message')
        .join());
    }
  }

  dvOnAfterCommit() {
    this.paid = true;
    this.payErrorText = '';
    window.setTimeout(() => {
      this.paid = false;
    }, SAVED_MSG_TIMEOUT);
  }

  dvOnAfterAbort(reason: Error) {
    this.payErrorText = reason.message;
  }
}
