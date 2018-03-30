import { Component, ElementRef, Input, OnInit, OnChanges } from '@angular/core';

import { GatewayService, GatewayServiceFactory } from 'dv-core';

import { Good } from '../shared/market.model';


@Component({
  selector: 'market-show-good',
  templateUrl: './show-good.component.html',
  styleUrls: ['./show-good.component.css']
})
export class ShowGoodComponent implements OnInit, OnChanges {
  @Input() id: string;
  @Input() good: Good;

  @Input() showId = true;
  @Input() showPrice = true;
  @Input() showSupply = true;
  @Input() showSeller = true;
  @Input() showMarket = true;

  @Input() noPriceText = 'No price';
  @Input() noSupplyText = 'No supply';
  @Input() noSellerText = 'No seller';
  @Input() noMarketText = 'No market';


  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory) {}

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.loadGood();
  }

  ngOnChanges() {
    this.loadGood();
  }

  loadGood() {
    // only load good when id is given
    if (!this.gs || this.good || !this.id) {
      return;
    }
    this.gs.get<{data: {good: Good}}>('/graphql', {
      params: {
        query: `
          query {
            good(id: "${this.id}") {
              ${this.showId ? 'id' : ''}
              ${this.showPrice ? 'price' : ''}
              ${this.showSupply ? 'supply' : ''}
              ${this.showSeller ? 'seller { id }' : ''}
              ${this.showMarket ? 'market { id }' : ''}
            }
          }
        `
      }
    })
    .subscribe((res) => {
      this.good = res.data.good;
    });
  }
}
