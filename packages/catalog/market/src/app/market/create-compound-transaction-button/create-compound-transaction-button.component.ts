import {GraphQlService} from "gql";
import {Widget, Field, PrimitiveAtom} from "client-bus";
import {CompoundTransactionAtom} from "../../shared/data";

import * as _u from "underscore";


@Widget({
  fqelement: "Market",
  ng2_providers: [GraphQlService]
})
export class CreateCompoundTransactionButtonComponent {
  @Field("CompoundTransaction") compoundTransaction: CompoundTransactionAtom;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;

  error = false;

  constructor(private _graphQlService: GraphQlService) {}

  createCompoundTransaction() {
    if (! this.isValid()) return;

    const transactionsToCreate = [];
    _u.each(this.compoundTransaction.transactions, transaction => {
      // default value for quantity
      if (!transaction.quantity) transaction.quantity = 1;

      transactionsToCreate.push(
        this._graphQlService
          .post(`
            CreateUnpaidTransaction(
              good_id: "${transaction.good.atom_id}",
              buyer_id: "${transaction.buyer.atom_id}",
              quantity: ${transaction.quantity},
              price: ${transaction.price}
            ) { atom_id }
          `)
          .subscribe(atom_id => {
            transaction.atom_id = atom_id;
            transaction.status = "unpaid";
          })
      );
    });

    Promise.all(transactionsToCreate)
      .then(_ => {
        this._graphQlService
          .post(`
            CreateCompoundTransaction(
              transactions: ${this.compoundTransaction.transactions},
            ) { atom_id }
          `)
          .subscribe(atom_id => {
              this.compoundTransaction.atom_id = atom_id;
              this.submit_ok.value = !this.submit_ok.value;
          });
      });
  }

  isValid() {
    // check that each transaction has a good atom id and a buyer atom id
    // and check same status and same buyer across all transactions
    if (this.compoundTransaction.transactions.length === 0) return true;
    const status = this.compoundTransaction.transactions[0].status;
    const buyer = this.compoundTransaction.transactions[0].buyer;
    return _u.every(this.compoundTransaction.transactions, transaction => {
      return transaction.good.atom_id && transaction.buyer.atom_id &&
        transaction.status === status && transaction.buyer === buyer;
    });
  }
}
