import { Component, ElementRef, Input } from '@angular/core';

import { GatewayService, GatewayServiceFactory } from 'dv-core';

import { map } from 'rxjs/operators';

import { Good } from "../shared/market.model";


@Component({
  selector: 'market-show-good',
  templateUrl: './show-good.component.html',
  styleUrls: ['./show-good.component.css'],
})
export class ShowGoodComponent {
  @Input() good: Good;

  @Input() showId = true;
  @Input() showName = true;
  @Input() showPrice = true;
  @Input() showSupply = true;
  @Input() showSeller = true;
  @Input() showMarket = true;

  @Input() noNameText = 'No name';
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
    // only load good when id is given and its fields haven't been loaded
    if (!this.gs || !this.good || !this.good.id || this.good.name) {
      return;
    }
    this.gs.get<{data: {good: Good}}>('/graphql', {
      params: {
        query: `
          query {
            good(id: "${this.good.id}") {
              id
              name
              price
              supply
              seller { id }
              market { id }
            }
          }
        `
      }
    })
    .pipe(map((res) => res.data.good))
    .subscribe((good: Good) => {
      this.good.name = good.name;
      this.good.price = good.price;
      this.good.supply = good.supply;
      this.good.seller = good.seller;
      this.good.market = good.market;
    })
  }
}
