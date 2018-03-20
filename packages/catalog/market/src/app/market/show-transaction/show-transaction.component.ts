import { Component, ElementRef, Input, Type } from '@angular/core';

import { Action, GatewayService, GatewayServiceFactory } from 'dv-core';

import { ShowGoodComponent } from '../show-good/show-good.component';

import { Transaction } from '../shared/market.model';


@Component({
  selector: 'market-show-transaction',
  templateUrl: './show-transaction.component.html',
  styleUrls: ['./show-transaction.component.css'],
})
export class ShowTransactionComponent {
  @Input() transaction: Transaction;

  @Input() showId = true;
  @Input() showSummary = true;
  @Input() showGoodDetails = true;
  @Input() showStatus = true;

  // For showGood if showGoodDetails is true
  @Input() showGoodId = true;
  @Input() showName = true;
  @Input() showPrice = true;
  @Input() showSupply = true;
  @Input() showSeller = true;
  @Input() showMarket = true;

  // Presentation inputs
  @Input() noGoodText = 'No good';
  @Input() noStatusText = 'No status';

  @Input() showGood: Action = {
    type: <Type<Component>> ShowGoodComponent
  };

  showTransaction;
  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory) {
    this.showTransaction = this;
  }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.loadTransaction();
  }

  ngOnChanges() {
    this.loadTransaction();
  }

  loadTransaction() {
    // only load transaction when id is given
    if (!this.gs || !this.transaction || !this.transaction.id) {
      return;
    }
    this.gs.get<{data: {transaction: Transaction}}>('/graphql', {
      params: {
        query: `
          query {
            transaction(id: "${this.transaction.id}") {
              id
              ${this.showSummary ?
                'pricePerGood\n' +
                'quantity' : ''
              }
              ${this.showSummary || this.showGoodDetails ?
                'good {' +
                  'id\n' +
                  'name\n' +
                '}' : ''
              }
              ${this.showStatus ? 'status' : ''}
            }
          }
        `
      }
    })
    .subscribe((res) => {
      this.transaction = res.data.transaction;
    });
  }
}
