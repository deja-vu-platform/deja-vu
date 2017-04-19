import {GraphQlService} from "gql";

import {Widget} from "client-bus";


@Widget({
  fqelement: "dv-organization-market",
  ng2_providers: [GraphQlService]
})
export class ShowMyGoodsComponent {
  seller = {atom_id: undefined};
  goods = [];

  constructor(private _graphQlService: GraphQlService) {}

  dvAfterInit() {

    this._graphQlService
      .get(`
        GoodsFromSeller(seller_id: "${this.seller.atom_id}"){
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
