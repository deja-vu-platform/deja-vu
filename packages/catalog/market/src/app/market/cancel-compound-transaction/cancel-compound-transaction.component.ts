import { Component, Input } from '@angular/core';

import {
  CompoundTransaction//, Good, Party, Market
} from "../shared/market.model";

@Component({
  selector: 'market-cancel-compound-transaction',
  templateUrl: './cancel-compound-transaction.component.html',
  styleUrls: ['./cancel-compound-transaction.component.css'],
})
export class CancelCompoundTransactionComponent {
  @Input() compoundTransaction: CompoundTransaction;

  constructor(private _graphQlService: GraphQlService) {}

  cancelCompoundTransaction() {
    if (!this.compoundTransaction.atom_id) return;

    this._graphQlService
      .post(`
        CancelUnpaidCompoundTransaction(
          compound_transaction_id: "${this.compoundTransaction.atom_id}"
        )
      `)
      .subscribe(_ => {
        if (this.compoundTransaction.transactions) {
          this.compoundTransaction.transactions.forEach(transaction => {
            transaction.status = "canceled";
          });
        }
        this.submit_ok.value = !this.submit_ok.value;
      });
  }
}
