import {
  Component, ElementRef, Input, OnChanges, OnInit, Type
} from '@angular/core';
import { Action, GatewayService, GatewayServiceFactory } from 'dv-core';

import { ShowTransactionComponent } from '../show-transaction/show-transaction.component';

import { Transaction, TransactionStatus } from '../shared/market.model';


@Component({
  selector: 'market-show-transactions',
  templateUrl: './show-transactions.component.html',
  styleUrls: ['./show-transactions.component.css'],
})
export class ShowTransactionsComponent implements OnInit, OnChanges {
  // Fetch rules
  // If undefined then the fetched tasks are not filtered by that property
  @Input() buyerId: string | undefined;
  @Input() sellerId: string | undefined;
  @Input() marketId: string | undefined;
  @Input() status: TransactionStatus | undefined;

  // Show rules
  /* What fields of the transaction and its associated good to show.
  These are passed as input to showTransaction` */
  @Input() showId = true;
  @Input() showSummary = true;
  @Input() showGoodDetails = true;
  @Input() showStatus = true;
  @Input() noTransactionsToShowText = 'No transactions to show';
  // For showGood in showTransaction
  @Input() showGoodId = true;
  @Input() showPrice = true;
  @Input() showSupply = true;
  @Input() showSeller = true;
  @Input() showMarketId = true;

  // Whether to show the user the option to {pay, cancel} a good
  // Requires buyer and seller
  @Input() showOptionToPay = true;
  @Input() showOptionToCancel = true;

  @Input() showTransaction: Action = {
    type: <Type<Component>> ShowTransactionComponent
  };
  transactions: Transaction[] = [];

  showTransactions;
  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory) {
    this.showTransactions = this;
  }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.fetchTransactions();
  }

  ngOnChanges() {
    this.fetchTransactions();
  }

  fetchTransactions() {
    if (this.gs) {
      this.gs
        .get<{data: {transactions: Transaction[]}}>('/graphql', {
          params: {
            query: `
              query Transactions($input: TransactionsInput!) {
                transactions(input: $input) {
                  id
                  ${this.showStatus || this.showOptionToCancel ? 'status': ''}
                  ${this.showOptionToPay ?
                    'buyer { id }\n' +
                    'seller { id }\n' : ''
                  }
                }
              }
            `,
            variables: JSON.stringify({
              input: {
                buyerId: this.buyerId,
                sellerId: this.sellerId,
                marketId: this.marketId,
                status: this.status
              }
            })
          }
        })
        .subscribe((res) => {
          this.transactions = res.data.transactions;
        });
    }
  }
}
