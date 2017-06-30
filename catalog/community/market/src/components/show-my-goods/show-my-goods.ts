import {GraphQlService} from "gql";

import {Widget, Field, Atom} from "client-bus";


@Widget({fqelement: "Market", ng2_providers: [GraphQlService]})
export class ShowMyGoodsComponent {
  @Field("Party") seller: Atom;
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
