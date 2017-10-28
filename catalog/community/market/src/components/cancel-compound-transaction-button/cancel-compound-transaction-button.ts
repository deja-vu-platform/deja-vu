import {GraphQlService} from "gql";
import {Widget, Field} from "client-bus";
import {CompoundTransactionAtom} from "../../shared/data";

@Widget({
  fqelement: "Market",
  ng2_providers: [GraphQlService]
})
export class CancelCompoundTransactionButtonComponent {
  @Field("CompoundTransaction") compoundTransaction: CompoundTransactionAtom;

  constructor(private _graphQlService: GraphQlService) {}

  cancelCompoundTransaction() {
    const canceledStatus = "canceled";
    if (!this.compoundTransaction.atom_id
      || this.compoundTransaction.status === canceledStatus) return;

    this._graphQlService
      .post(`
        CancelCompoundTransaction(
          compound_transaction_id: "${this.compoundTransaction.atom_id}"
        )
      `)
      .subscribe(_ => {
        this.compoundTransaction.status = canceledStatus;
      });
  }
}
