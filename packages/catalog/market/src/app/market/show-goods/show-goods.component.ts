import {
  Component, ElementRef, EventEmitter, Inject, Input, OnChanges, OnInit,
  SimpleChanges, Type
} from '@angular/core';
import { Action, GatewayService, GatewayServiceFactory } from 'dv-core';

import { filter, take } from 'rxjs/operators';

import * as _ from 'lodash';

import { ShowGoodComponent } from '../show-good/show-good.component';

import { API_PATH } from '../market.config';
import { Good } from '../shared/market.model';


@Component({
  selector: 'market-show-goods',
  templateUrl: './show-goods.component.html',
  styleUrls: ['./show-goods.component.css']
})
export class ShowGoodsComponent implements OnInit, OnChanges {
  // A list of fields to wait for
  @Input() waitOn: string[] = [];
  // Watcher of changes to fields specified in `waitOn`
  // Emits the field name that changes
  fieldChange = new EventEmitter<string>();

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
  @Input() showMarketId = true;
  @Input() noGoodsToShowText = 'No goods to show';

  // Whether to show the user the option to {buy, ...} a good
  // Requires optionToBuyBuyerId
  @Input() showOptionToBuy = true;
  @Input() optionToBuyBuyerId: string | undefined;
  @Input() optionToBuyButtonLabel = 'Buy';
  @Input() optionToBuyInputQuantityLabel = 'Quantity';
  // Requires buyerId and compoundTransactionId
  @Input() showOptionToAddToCompoundTransaction = true;
  @Input() optionToAddToCompoundTransactionBuyerId: string | undefined;
  @Input() compoundTransactionId = '';
  // @Input() showOptionToDelete = true; // for next time

  @Input() showGood: Action = {
    type: <Type<Component>> ShowGoodComponent
  };
  goods: Good[] = [];

  showGoods;
  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    @Inject(API_PATH) private apiPath) {
    this.showGoods = this;
  }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.fetchGoods();
  }

  ngOnChanges(changes: SimpleChanges) {
    for (const field of this.waitOn) {
      if (changes[field]) {
        this.fieldChange.emit(field);
      }
    }
    this.fetchGoods();
  }

  async fetchGoods() {
    if (this.gs) {
      await Promise.all(_.chain(this.waitOn)
        .filter((field) => !this[field])
        .map((fieldToWaitFor) => this.fieldChange
          .pipe(filter((field) => field === fieldToWaitFor), take(1))
          .toPromise())
        .value());

      this.gs
        .get<{data: {goods: Good[]}}>(this.apiPath, {
          params: {
            query: `
              query Goods($input: GoodsInput!) {
                goods(input: $input) {
                  ${this.showId ? 'id' : ''}
                  ${this.showPrice ? 'price' : ''}
                  ${this.showSupply ? 'supply' : ''}
                  ${this.showSeller ? 'seller { id }' : ''}
                  ${this.showMarketId ? 'marketId' : ''}
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
