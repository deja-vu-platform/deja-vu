import { Component, Input } from '@angular/core';

import {
  CompoundTransaction//, Good, Party, Market
} from "../shared/market.model";

@Component({
  selector: 'market-pay-compound-transaction',
  templateUrl: './pay-compound-transaction.component.html',
  styleUrls: ['./pay-compound-transaction.component.css'],
})
export class PayCompoundTransactionComponent {
  @Input() compoundTransaction: CompoundTransaction;

  paid = false;

  constructor(private _graphQlService: GraphQlService) {}

  dvAfterInit() {
    this.submit_ok.on_change(() => {
      this.pay();
    });
  }

  pay() {
    if (!this.compoundTransaction.atom_id || this.paid) return;

    this._graphQlService
      .post(`
        PayForCompoundTransaction(
          compound_transaction_id: "${this.compoundTransaction.atom_id}"
        )
      `)
      .subscribe(_ => {
        this.compoundTransaction.transactions.forEach(transaction => {
          transaction.status = "paid";
        });
        this.paid = true;
        this.submit_ok.value = !this.submit_ok.value;
      });
  }
}
