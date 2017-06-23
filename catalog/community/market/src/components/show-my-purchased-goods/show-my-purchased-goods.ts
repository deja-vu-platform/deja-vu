import {GraphQlService} from "gql";

import {Widget} from "client-bus";


@Widget({
  fqelement: "Market",
  ng2_providers: [GraphQlService]
})
export class ShowMyPurchasedGoodsComponent {
  buyer = {atom_id: undefined};
  market = {atom_id: undefined}
  goods = [];

  constructor(private _graphQlService: GraphQlService) {}

  dvAfterInit() {
    if (!this.buyer.atom_id || !this.market.atom_id) {
      return;
    }
    this._graphQlService
      .get(`
        GoodsFromBuyer(
          buyer_id: "${this.buyer.atom_id}",
          market_id: "${this.market.atom_id}"
        ) {
          atom_id,
          name,
          offer_price
        }
      `)
      .subscribe(data => {
        this.goods = data.GoodsFromBuyer;
      });
  }
}
