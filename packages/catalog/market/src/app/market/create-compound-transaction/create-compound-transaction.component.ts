import {
  Component, ElementRef, EventEmitter, Input, OnInit, Output
} from '@angular/core';

import {
  GatewayService, GatewayServiceFactory, OnAfterAbort, OnAfterCommit, OnRun,
  RunService
} from 'dv-core';

import * as _ from 'lodash';


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
    private rs: RunService) {}

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  onSubmit() {
    this.rs.run(this.elem);
  }

  async dvOnRun(): Promise<void> {
    const res = await this.gs
      .post<{data: {createCompoundTransaction: {id: string}}, errors: {message: string}[]}>(
        '/graphql', {
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
