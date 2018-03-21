import {
  Component, ElementRef, Input, OnChanges, OnInit, Type
} from '@angular/core';
import { Action, GatewayService, GatewayServiceFactory } from 'dv-core';

import { ShowGoodComponent } from '../show-good/show-good.component';

import { Good } from '../shared/market.model';


@Component({
  selector: 'market-show-goods',
  templateUrl: './show-goods.component.html',
  styleUrls: ['./show-goods.component.css']
})
export class ShowGoodsComponent implements OnInit, OnChanges {
  // Fetch rules
  // If undefined then the fetched goods are not filtered by that property
  @Input() buyerId: string | undefined;
  @Input() sellerId: string | undefined;
  @Input() marketId: string | undefined;
  // could work in conjunction with a search feature next time:
  // @Input() lessThanEqPrice: number | undefined;

  @Input() affordable: boolean | undefined; // only valid when buyerId is set
  @Input() available: boolean | undefined; // i.e. supply > 0

  // Show rules
  /* What fields of the good to show. These are passed as input
    to showGood` */
  @Input() showId = true;
  @Input() showPrice = true;
  @Input() showSupply = true;
  @Input() showSeller = true;
  @Input() showMarket = true;

  // Whether to show the user the option to {buy, ...} a good
  // Requires buyerId
  @Input() showOptionToBuy = true;
  // Requires buyerId and compoundTransactionId
  @Input() showOptionToAddToComopundTransaction = true;
  @Input() compoundTransactionId: string = '';
  // @Input() showOptionToDelete = true; // for next time

  @Input() showGood: Action = {
    type: <Type<Component>> ShowGoodComponent
  };
  goods: Good[] = [];

  showGoods;
  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory) {
    this.showGoods = this;
  }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.fetchGoods();
  }

  ngOnChanges() {
    this.fetchGoods();
  }

  fetchGoods() {
    if (this.gs) {
      this.gs
        .get<{data: {goods: Good[]}}>('/graphql', {
          params: {
            query: `
              query Goods($input: GoodsInput!) {
                goods(input: $input) {
                  ${this.showId ? 'id' : ''}
                  ${this.showPrice ? 'price' : ''}
                  ${this.showSupply ? 'supply' : ''}
                  ${this.showSeller ? 'seller { id }' : ''}
                  ${this.showMarket ? 'market { id }' : ''}
                }
              }
            `,
            variables: JSON.stringify({
              input: {
                buyerId: this.buyerId,
                sellerId: this.sellerId,
                marketId: this.marketId,
                affordable: this.affordable,
                available: this.available
              }
            })
          }
        })
        .subscribe((res) => {
          this.goods = res.data.goods;
        });
    }
  }
}
