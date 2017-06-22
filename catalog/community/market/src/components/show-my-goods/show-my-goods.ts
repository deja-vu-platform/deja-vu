import {GraphQlService} from "gql";

import {Widget} from "client-bus";


@Widget({fqelement: "Market", ng2_providers: [GraphQlService]})
export class ShowMyGoodsComponent {
  seller = {atom_id: undefined};
  market = {atom_id: undefined}
  goods = [];

  constructor(private _graphQlService: GraphQlService) {}

  dvAfterInit() {
    if (!this.seller.atom_id || !this.market.atom_id) {
      return;
    }
    this._graphQlService
      .get(`
        GoodsFromSeller(
          seller_id: "${this.seller.atom_id}",
          market_id: "${this.market.atom_id}"
        ) {
          atom_id,
          name,
          offer_price
        }
      `)
      .subscribe(data => {
        this.goods = data.GoodsFromSeller;
      });
  }
}
