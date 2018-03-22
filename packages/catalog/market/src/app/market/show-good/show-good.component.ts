import { Component, ElementRef, Input } from '@angular/core';

import { GatewayService, GatewayServiceFactory } from 'dv-core';

import { Good } from '../shared/market.model';


@Component({
  selector: 'market-show-good',
  templateUrl: './show-good.component.html',
  styleUrls: ['./show-good.component.css'],
})
export class ShowGoodComponent {
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
    if (!this.gs || !this.good || !this.good.id) {
      return;
    }
    this.gs.get<{data: {good: Good}}>('/graphql', {
      params: {
        query: `
          query {
            good(id: "${this.good.id}") {
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
    })
  }
}
