import {GraphQlService} from "gql";
import {Widget, Field, PrimitiveAtom} from "client-bus";
import {CompoundTransactionAtom} from "../../shared/data";


@Widget({
  fqelement: "Market",
  ng2_providers: [GraphQlService]
})
export class PayForCompoundTransactionButtonComponent {
  @Field("CompoundTransaction") compoundTransaction: CompoundTransactionAtom;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;

  paid = false;

  constructor(private _graphQlService: GraphQlService) {}

  dvAfterInit() {
    this.submit_ok.on_change(() => {
      this.pay();
    });
  }

  pay() {
    if (!this.compoundTransaction.atom_id || this.paid) return;

    this._graphQlService
      .post(`
        PayForCompoundTransaction(
          compound_transaction_id: "${this.compoundTransaction.atom_id}"
        )
      `)
      .subscribe(_ => {
        this.compoundTransaction.transactions.forEach(transaction => {
          transaction.status = "paid";
        });
        this.paid = true;
        this.submit_ok.value = !this.submit_ok.value;
      });
  }
}
