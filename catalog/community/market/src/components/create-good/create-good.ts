import {GraphQlService} from "gql";

import {Widget} from "client-bus";


@Widget({fqelement: "Market", ng2_providers: [GraphQlService]})
export class CreateGoodComponent {
  seller = {atom_id: undefined};
  good = {atom_id: undefined, name: "", offer_price: undefined};
  market = {atom_id: undefined};

  constructor(private _graphQlService: GraphQlService) {}

  onSubmit() {
    if (!this.seller.atom_id) {
      return;
    }

    this._graphQlService
      .post(`
        CreateGood(name: "${this.good.name}", 
          offer_price: ${this.good.offer_price},
          seller_id: "${this.seller.atom_id}",
          market_id: "${this.market.atom_id}"
          ) {
            atom_id
          }
      `)
      .subscribe(_ => {
        this.good.atom_id = "";
        this.good.name = "";
        this.good.offer_price = "";
      });
  }
}
