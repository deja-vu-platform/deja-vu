import {GraphQlService} from "gql";
import {Widget, Field} from "client-bus";
import {CompoundTransactionAtom, TransactionAtom} from "../../shared/data";

@Widget({
  fqelement: "Market",
  ng2_providers: [GraphQlService]
})
export class AddTransactionButtonComponent {
  @Field("CompoundTransaction") compoundTransaction: CompoundTransactionAtom;
  @Field("Transaction") transaction: TransactionAtom;

  error = false;

  constructor(private _graphQlService: GraphQlService) {}

  addTransaction() {
    // clear past errors
    this.error = false;
    if (!this.valid()) return;

    // set default value for quantity if none
    if (!this.transaction.quantity && this.transaction.quantity !== 0) {
      this.transaction.quantity = 1;
    }

    this._graphQlService
      .get(`
        compoundtransaction_by_id(
          atom_id: "${this.compoundTransaction.atom_id}") {
          addTransaction(
            good_id: "${this.transaction.good.atom_id}",
            buyer_id: "${this.transaction.buyer.atom_id}",
            quantity: "${this.transaction.quantity}",
            price: "${this.transaction.price}",
            status: "${this.transaction.status}"
          )
        }
      `)
      .subscribe(
        transaction => this.transaction.atom_id = transaction.atom_id,
        // error likely caused if transaction does not have the same status 
        // as the ones in the compound transaction
        err => this.error = true
      );
  }

  valid() {
    return this.compoundTransaction.atom_id && this.transaction.good.atom_id
      && this.transaction.buyer.atom_id;
  }
}
