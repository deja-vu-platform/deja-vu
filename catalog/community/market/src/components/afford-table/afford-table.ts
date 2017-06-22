import {GraphQlService} from "gql";

import {Widget} from "client-bus";


@Widget({
  fqelement: "Market",
  ng2_providers: [GraphQlService]
})
export class AffordTableComponent {
  buyer = {atom_id: undefined};
  market = {atom_id: undefined};
  affordableGoods = [];
  unaffordableGoods = [];

  constructor(private _graphQlService: GraphQlService) {}

  dvAfterInit() {
    if (!this.buyer.atom_id || !this.market.atom_id) {
      return;
    }

    this._graphQlService
      .get(`
        AffordableGoods(
          market_id: "${this.market.atom_id}",
          buyer_id: "${this.buyer.atom_id}"
        ) {
          atom_id,
          name,
          offer_price
        }
      `)
      .subscribe(data => {
        this.affordableGoods = data.AffordableGoods;
      })
    ;

    this._graphQlService
      .get(`
        UnaffordableGoods(
          market_id: "${this.market.atom_id},
          buyer_id: "${this.buyer.atom_id}"
        ) {
          atom_id,
          name,
          offer_price
        }
      `)
      .subscribe(data => {
        this.unaffordableGoods = data.UnaffordableGoods;
      })
    ;
  }
}
