import {GraphQlService} from "gql";

import {Widget} from "client-bus";


@Widget({
  fqelement: "dv-organization-market",
  ng2_providers: [GraphQlService]
})
export class ShowGoodsToBuyComponent {
  goods = [];

  constructor(private _graphQlService: GraphQlService) {}

  dvAfterInit() {

    this._graphQlService
      .get(`
        good_all {
          atom_id,
          name,
          offer_price
        }
      `)
      .subscribe(data => {
        this.goods = data.good_all;
      });
  }
}
