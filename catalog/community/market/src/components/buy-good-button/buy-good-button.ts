import {GraphQlService} from "gql";

import {Widget} from "client-bus";


@Widget({
  fqelement: "Market",
  ng2_providers: [GraphQlService]
})
export class BuyGoodButtonComponent {
  good = {atom_id: undefined};
  buyer = {atom_id: undefined};
  quantity = {value: 1};
  fraction = {value: 1};

  constructor(private _graphQlService: GraphQlService) {}

  buyGood() {
    console.log(this.quantity);
    if (!this.good.atom_id || !this.buyer.atom_id) return;

    this._graphQlService
      .post(`
        BuyGood(
          good_id: "${this.good.atom_id}",
          buyer_id: "${this.buyer.atom_id}",
          quantity: ${this.quantity.value},
          fraction: ${this.fraction.value}
        )
      `)
      .subscribe(res => undefined)
    ;
  }

  valid() {
    return (this.good.atom_id && this.buyer.atom_id);
  }
}
