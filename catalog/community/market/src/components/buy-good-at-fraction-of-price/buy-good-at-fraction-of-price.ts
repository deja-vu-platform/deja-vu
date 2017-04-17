import {GraphQlService} from "gql";

import {Widget} from "client-bus";


@Widget({
  fqelement: "dv-organization-market",
  ng2_providers: [GraphQlService]
})
export class BuyGoodAtFractionOfPriceComponent {
  good = {atom_id: undefined};
  fraction: number;
  buyer = {atom_id: undefined};

  constructor(private _graphQlService: GraphQlService) {}

  buyGood() {
    if (!this.good.atom_id || !this.buyer.atom_id) return;

    this._graphQlService
      .post(`
        BuyGood(good_id: "${this.good.atom_id}", fraction: ${this.fraction}, 
          buyer_id: "${this.buyer.atom_id}")
      `)
      .subscribe(res => undefined);
  }
}
