import {GraphQlService} from "gql";
import {Widget, Field} from "client-bus";
import {CompoundTransactionAtom} from "../../shared/data";

@Widget({
  fqelement: "Market",
  ng2_providers: [GraphQlService]
})
export class PayForCompoundTransactionButtonComponent {
  @Field("CompoundTransaction") compoundTransaction: CompoundTransactionAtom;

  constructor(private _graphQlService: GraphQlService) {}

  pay() {
    if (!this.compoundTransaction.atom_id) return;

    this._graphQlService
      .post(`
        PayForCompoundTransaction(
          compound_transaction_id: "${this.compoundTransaction.atom_id}"
        )
      `)
      .subscribe(_ => {
        this.compoundTransaction.paid = true;
      });
  }
}
