import {
  Component, ElementRef, EventEmitter, Inject, Input, OnInit, Output
} from '@angular/core';

import {
  GatewayService, GatewayServiceFactory, OnAfterAbort, OnAfterCommit, OnRun,
  RunService
} from 'dv-core';

import * as _ from 'lodash';

import { API_PATH } from '../market.config';
import { CompoundTransaction } from '../shared/market.model';

interface CreateCompoundTransactionRes {
  data: { createCompoundTransaction: CompoundTransaction },
  errors: { message: string }[]
}

const SAVED_MSG_TIMEOUT = 3000;

@Component({
  selector: 'market-create-compound-transaction',
  templateUrl: './create-compound-transaction.component.html',
  styleUrls: ['./create-compound-transaction.component.css'],
})
export class CreateCompoundTransactionComponent implements
  OnInit, OnRun, OnAfterCommit, OnAfterAbort {
  @Input() id: string = ''; // optional
  @Output() compoundTransaction = new EventEmitter();

  // Presentation inputs
  @Input() buttonLabel = 'Create';
  @Input() inputLabel = 'Id';
  @Input() newCompoundTransactionSavedText = 'New compound transaction saved';

  newCompoundTransactionSaved = false;
  newCompoundTransactionError: string;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, @Inject(API_PATH) private apiPath) {}

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  onSubmit() {
    this.rs.run(this.elem);
  }

  async dvOnRun(): Promise<void> {
    const res = await this.gs.post<CreateCompoundTransactionRes>(this.apiPath, {
      query: `mutation {
        createCompoundTransaction(id: "${this.id}") {
          id
        }
      }`,
      variables: {
        input: {
          id: this.id
        }
      }
    })
    .toPromise();

    if (res.errors) {
      throw new Error(_.map(res.errors, 'message')
        .join());
    }
    this.compoundTransaction.emit({ id: res.data.createCompoundTransaction.id });
  }

  dvOnAfterCommit() {
    this.newCompoundTransactionSaved = true;
    this.newCompoundTransactionError = '';
    window.setTimeout(() => {
      this.newCompoundTransactionSaved = false;
    }, SAVED_MSG_TIMEOUT);
  }

  dvOnAfterAbort(reason: Error) {
    this.newCompoundTransactionError = reason.message;
  }
}
