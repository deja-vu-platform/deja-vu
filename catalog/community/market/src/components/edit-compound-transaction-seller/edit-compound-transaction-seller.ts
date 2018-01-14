import {GraphQlService} from "gql";
import {Widget, Field, PrimitiveAtom} from "client-bus";
import {PartyAtom, CompoundTransactionAtom} from "../../shared/data";

@Widget({
  fqelement: "Market",
  ng2_providers: [GraphQlService],
  template: ``
})
export class EditCompoundTransactionSellerComponent {
  @Field("CompoundTransaction") compound_transaction: CompoundTransactionAtom;
  @Field("Party") seller: PartyAtom;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;

  constructor(private _graphQlService: GraphQlService) {}

  dvAfterInit() {
    this.submit_ok.on_change(() => {
      if (this.compound_transaction.atom_id && this.seller.atom_id) {
        this._graphQlService
        .get(`
          compoundtransaction_by_id(
          atom_id: "${this.compound_transaction.atom_id}") {
            updateTransactions(
              seller_id: "${this.seller.atom_id}"
            )
          }
        `)
        .subscribe(_ => undefined);
      }
    });
  }
}
