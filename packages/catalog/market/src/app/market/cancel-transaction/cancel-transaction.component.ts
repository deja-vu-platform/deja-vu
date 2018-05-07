import {
  Component, ElementRef, EventEmitter, Inject, Input, OnInit
} from '@angular/core';

import {
  GatewayService, GatewayServiceFactory, OnAfterAbort, OnAfterCommit, OnRun,
  RunService
} from 'dv-core';

import * as _ from 'lodash';

import { API_PATH } from '../market.config';

interface CancelTransactionRes {
  data: { cancelTransaction: boolean },
  errors: { message: string }[]
}

const SAVED_MSG_TIMEOUT = 3000;

@Component({
  selector: 'market-cancel-transaction',
  templateUrl: './cancel-transaction.component.html',
  styleUrls: ['./cancel-transaction.component.css']
})
export class CancelTransactionComponent implements
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
    const res = await this.gs.post<CancelTransactionRes>(this.apiPath, {
      query: `mutation {
        cancelTransaction(id: "${this.id}")
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
