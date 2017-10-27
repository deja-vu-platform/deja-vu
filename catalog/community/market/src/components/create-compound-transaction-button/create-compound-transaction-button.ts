import {GraphQlService} from "gql";
import {Widget, Field} from "client-bus";
import {
  CompoundTransactionAtom,
  Transaction
} from "../../shared/data";

import "rxjs/add/operator/map";
import "rxjs/add/operator/toPromise";
import * as _u from "underscore";


@Widget({
  fqelement: "Market",
  ng2_providers: [GraphQlService]
})
export class CreateCompoundTransactionButtonComponent {
  @Field("CompoundTransaction") compoundTransaction: CompoundTransactionAtom;

  constructor(private _graphQlService: GraphQlService) {}

  createCompoundTransaction() {
    if (! this.valid()) return;

    this._graphQlService
      .post(`
        CreateCompoundTransaction(
          buyer_id: "${this.compoundTransaction.buyer.atom_id}")
          { atom_id }
      `)
      .subscribe(atom_id => {
        Promise.all(
          _u.map(this.compoundTransaction.transactions,
            (transaction: Transaction) => {
              return this._graphQlService
                .post(`
                  addTransaction(
                    "${atom_id}",
                    good_id: "${transaction.good.atom_id}",
                    buyer_id: "${transaction.buyer.atom_id}",
                    quantity: "${transaction.quantity}",
                    price: "${transaction.price}"
                  )
                `)
                .toPromise();
            })
        )
        .then(_ => {
          this.compoundTransaction.atom_id = "";
          this.compoundTransaction.transactions = [];
        });
      });
  }

  valid() {
    return this.compoundTransaction.buyer.atom_id;
  }
}
