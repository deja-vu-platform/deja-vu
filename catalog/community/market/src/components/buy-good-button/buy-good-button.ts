import {GraphQlService} from "gql";
import {Widget, Field, PrimitiveAtom} from "client-bus";
import {PartyAtom, GoodAtom} from "../../shared/data";

@Widget({
  fqelement: "Market",
  ng2_providers: [GraphQlService]
})
export class BuyGoodButtonComponent {
  @Field("Good") good: GoodAtom;
  @Field("Party") buyer: PartyAtom;
  @Field("number") quantity: PrimitiveAtom<number>;
  @Field("number") fraction: PrimitiveAtom<number>;

  constructor(private _graphQlService: GraphQlService) {}

  buyGood() {
    if (!this.good.atom_id || !this.buyer.atom_id) return;

    // default values for quantity and fraction
    if (!this.quantity.value && this.quantity.value !== 0) {
      this.quantity.value = 1;
    }
    if (!this.fraction.value && this.fraction.value !== 0) {
      this.fraction.value = 1;
    }

    this._graphQlService
      .post(`
        BuyGood(
          good_id: "${this.good.atom_id}",
          buyer_id: "${this.buyer.atom_id}",
          quantity: ${this.quantity.value},
          fraction: ${this.fraction.value},
        )
      `)
      .subscribe(_ => {
        this.quantity.value = undefined;
        this.fraction.value = undefined;
      });
  }

  valid() {
    return (this.good.atom_id && this.buyer.atom_id);
  }
}
