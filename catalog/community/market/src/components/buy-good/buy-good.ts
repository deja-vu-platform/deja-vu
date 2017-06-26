import {GraphQlService} from "gql";

import {Widget, Field, Atom} from "client-bus";


@Widget({fqelement: "Market", ng2_providers: [GraphQlService]})
export class BuyGoodComponent {
  @Field("Good") good: Atom;
  @Field("Party") buyer: Atom;

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
