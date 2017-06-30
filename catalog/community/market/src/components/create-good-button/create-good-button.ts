import {GraphQlService} from "gql";
import {Widget, Field} from "client-bus";
import {MarketAtom, PartyAtom, GoodAtom} from "../../shared/data";

@Widget({
  fqelement: "Market",
  ng2_providers: [GraphQlService]
})
export class CreateGoodButtonComponent {
  @Field("Good") good: GoodAtom;
  @Field("Party") seller: PartyAtom;
  @Field("Market") market: MarketAtom;

  constructor(private _graphQlService: GraphQlService) {}

  createGood() {
    if (!this.seller.atom_id || !this.market.atom_id) {
      return;
    }

    // default values for quantity and price
    if (!this.good.quantity && this.good.quantity !== 0) {
      this.good.quantity = 1;
    }
    if (!this.good.price && this.good.price !== 0) {
      this.good.price = 0;
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
        this.good.price = undefined;
        this.good.quantity = undefined;
      })
    ;
  }

  valid() {
    return (this.seller.atom_id && this.market.atom_id);
  }
}
