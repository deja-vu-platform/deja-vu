import {GraphQlService} from "gql";
import {Widget, Field, PrimitiveAtom} from "client-bus";
import {CompoundTransactionAtom} from "../../shared/data";


@Widget({
  fqelement: "Market",
  ng2_providers: [GraphQlService]
})
export class CancelCompoundTransactionButtonComponent {
  @Field("CompoundTransaction") compoundTransaction: CompoundTransactionAtom;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;

  constructor(private _graphQlService: GraphQlService) {}

  cancelCompoundTransaction() {
    if (!this.compoundTransaction.atom_id) return;

    this._graphQlService
      .post(`
        CancelUnpaidCompoundTransaction(
          compound_transaction_id: "${this.compoundTransaction.atom_id}"
        )
      `)
      .subscribe(_ => {
        if (this.compoundTransaction.transactions) {
          this.compoundTransaction.transactions.forEach(transaction => {
            transaction.status = "canceled";
          });
        }
        this.submit_ok.value = !this.submit_ok.value;
      });
  }
}
