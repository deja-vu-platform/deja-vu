import {GraphQlService} from "gql";

import {Widget, Field, Atom, PrimitiveAtom} from "client-bus";


@Widget({fqelement: "Market", ng2_providers: [GraphQlService]})
export class BuyGoodAtFractionOfPriceComponent {
  @Field("Good") good: Atom;
  @Field("number") fraction: PrimitiveAtom<number>;
  @Field("Party") buyer: Atom;

  constructor(private _graphQlService: GraphQlService) {}

  buyGood() {
    if (!this.good.atom_id || !this.buyer.atom_id) return;

    this._graphQlService
      .post(`
        BuyGood(
          good_id: "${this.good.atom_id}", fraction: ${this.fraction.value}, 
          buyer_id: "${this.buyer.atom_id}")
      `)
      .subscribe(res => undefined);
  }
}
