import {GraphQlService} from "gql";
import {Widget, Field, PrimitiveAtom} from "client-bus";
import {
  CompoundTransactionAtom,
  MarketAtom,
  PartyAtom,
  GoodAtom
} from "../../shared/data";

@Widget({
  fqelement: "Market",
  ng2_providers: [GraphQlService]
})
export class StartCompoundTransactionButtonComponent {
  @Field("CompoundTransaction") compound_transaction: CompoundTransactionAtom;
  @Field("Good") good: GoodAtom;
  @Field("Party") buyer: PartyAtom;
  @Field("Market") market: MarketAtom;
  @Field("number") quantity: PrimitiveAtom<number>;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;

  constructor(private _graphQlService: GraphQlService) {}

  startCompoundTransaction() {
    if (!this.buyer.atom_id || !this.market.atom_id) {
      return;
    }

    // default values for supply and price
    if (!this.good.supply && this.good.supply !== 0) {
      this.good.supply = 1;
    }
    if (!this.good.price && this.good.price !== 0) {
      this.good.price = 0;
    }

    this._graphQlService
      .post(`
        CreateGood(
          name: "${this.good.name}",
          price: ${this.good.price},
          supply: ${this.good.supply},
          market_id: "${this.market.atom_id}"
          ) {
            atom_id
          }
      `)
      .map(data => data.CreateGood)
      .subscribe(good => {
        this.good.atom_id = good.atom_id;

        // default value for quantity
        if (!this.quantity.value && this.quantity.value !== 0) {
          this.quantity.value = 1;
        }

        this._graphQlService
          .post(`
            CreateUnpaidTransaction(
              good_id: "${this.good.atom_id}",
              buyer_id: "${this.buyer.atom_id}",
              quantity: ${this.quantity.value},
              price: ${this.good.price}
            ) { atom_id }
          `)
          .map(data => data.CreateUnpaidTransaction)
          .subscribe(transaction => {
            this._graphQlService
              .post(`
                CreateCompoundTransaction(
                  transactions: ["${transaction.atom_id}"]
                ) { atom_id }
              `)
              .map(data => data.CreateCompoundTransaction)
              .subscribe(compound_transaction => {
                this.compound_transaction.atom_id =
                  compound_transaction.atom_id;
                this.good.name = "";
                this.good.price = undefined;
                this.good.supply = undefined;
                this.quantity.value = undefined;
                this.submit_ok.value = true;
              });
          });
      })
    ;
  }

  valid() {
    return (this.buyer.atom_id && this.market.atom_id);
  }
}
