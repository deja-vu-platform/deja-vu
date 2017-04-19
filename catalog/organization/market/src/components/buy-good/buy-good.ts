import {GraphQlService} from "gql";

import {Widget} from "client-bus";


@Widget({
  fqelement: "dv-organization-market",
  ng2_providers: [GraphQlService]
})
export class BuyGoodComponent {
  good = {atom_id: undefined};
  buyer = {atom_id: undefined};

  constructor(private _graphQlService: GraphQlService) {}

  buyGood() {
    if (!this.good.atom_id || !this.buyer.atom_id) return;

    this._graphQlService
      .post(`
        BuyGood(good_id: "${this.good.atom_id}", fraction: 1,
          buyer_id: "${this.buyer.atom_id}")
      `)
      .subscribe(res => undefined);
  }
}
