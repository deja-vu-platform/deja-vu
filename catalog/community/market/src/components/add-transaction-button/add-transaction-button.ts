import {GraphQlService} from "gql";
import {Widget, Field, PrimitiveAtom} from "client-bus";
import {
  CompoundTransactionAtom,
  GoodAtom,
  PartyAtom,
  MarketAtom
} from "../../shared/data";


@Widget({
  fqelement: "Market",
  ng2_providers: [GraphQlService]
})
export class AddTransactionButtonComponent {
  @Field("CompoundTransaction") compoundTransaction: CompoundTransactionAtom;
  @Field("Good") good: GoodAtom;
  @Field("Party") seller: PartyAtom;
  @Field("Party") buyer: PartyAtom;
  @Field("Market") market: MarketAtom;
  @Field("number") quantity: PrimitiveAtom<number>;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;

  error = false;

  constructor(private _graphQlService: GraphQlService) {}

  addTransaction() {
    // clear past errors
    this.error = false;
    if (!this.valid()) return;

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
          seller_id: "${this.seller.atom_id}",
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
          .get(`
            compoundtransaction_by_id(
              atom_id: "${this.compoundTransaction.atom_id}") {
              addTransaction(
                good_id: "${this.good.atom_id}",
                buyer_id: "${this.buyer.atom_id}",
                quantity: ${this.quantity.value},
                price: ${this.good.price},
                status: "unpaid"
              ) { atom_id }
            }
          `)
          .subscribe(_ => {
              this.good.name = "";
              this.good.price = undefined;
              this.good.supply = undefined;
              this.quantity.value = undefined;
              console.log(this.submit_ok.value);
              this.submit_ok.value = !this.submit_ok.value;
              console.log(this.submit_ok.value);
            },
            // could be caused if transaction doesn't have the same status 
            // as the ones in the compound transaction
            err => {
             console.log(err);
             this.error = true;
           }
          );
      });
  }

  valid() {
    return this.compoundTransaction.atom_id && this.seller.atom_id &&
      this.buyer.atom_id && this.market.atom_id;
  }
}
