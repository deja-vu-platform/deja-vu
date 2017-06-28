import {GraphQlService} from "gql";

import {Widget} from "client-bus";


@Widget({
  fqelement: "Market",
  ng2_providers: [GraphQlService]
})
export class CreateGoodButtonComponent {
  seller = {atom_id: undefined};
  good = {
    atom_id: "",
    name: "",
    price: 0,
    quantity: 1
  };
  market = {atom_id: undefined};

  constructor(private _graphQlService: GraphQlService) {}

  createGood() {
    if (!this.seller.atom_id || !this.market.atom_id) {
      return;
    }

    this._graphQlService
      .post(`
        CreateGood(
          name: "${this.good.name}",
          price: ${this.good.price},
          quantity: ${this.good.quantity},
          seller_id: "${this.seller.atom_id}",
          market_id: "${this.market.atom_id}"
          ) {
            atom_id
          }
      `)
      .subscribe(_ => {
        this.good.atom_id = "";
        this.good.name = "";
        this.good.price = 0;
        this.good.quantity = 1;
      })
    ;
  }

  valid() {
    return (this.seller.atom_id && this.market.atom_id);
  }
}
