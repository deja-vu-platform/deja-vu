import {GraphQlService} from "gql";
import {Widget, ClientBus, Field} from "client-bus";
import {
  CompoundTransactionAtom,
  GoodAtom,
  PartyAtom,
  TransactionAtom
} from "../../shared/data";

import {Observable} from "rxjs/Observable";
import "rxjs/add/observable/from";
import "rxjs/add/operator/map";

@Widget({
  fqelement: "Market",
  ng2_providers: [GraphQlService]
})
export class ShowCompoundTransactionComponent {
  @Field("CompoundTransaction") compoundTransaction: CompoundTransactionAtom;

  constructor(
    private _graphQlService: GraphQlService,
    private _clientBus: ClientBus
  ) {}

  dvAfterInit() {
    if (!this.compoundTransaction.atom_id) return;
    this.compoundTransaction.transactions = [];
    this._graphQlService
      .get(`
        compoundtransaction_by_id(
          atom_id: "${this.compoundTransaction.atom_id}") {
          transactions {
            atom_id,
            good { name },
            price,
            quantity
          },
          status
        }
      `)
      .map(data => data.compoundtransaction_by_id)
      .subscribe(compound_transaction => {
        this.compoundTransaction.status = compound_transaction.status;

        compound_transaction.transactions
          .flatMap((transactions, unused_ix) => Observable.from(transactions))
          .map((transaction: TransactionAtom) => {
            const transaction_atom = this.
              _clientBus.new_atom<TransactionAtom>("Transaction");
            const good_atom = this._clientBus.new_atom<GoodAtom>("Good");
            const seller_atom = this._clientBus.new_atom<PartyAtom>("Party");
            const buyer_atom = this._clientBus.new_atom<PartyAtom>("Party");
            good_atom.atom_id = transaction.good.atom_id;
            good_atom.name = transaction.good.name;
            buyer_atom.atom_id = transaction.buyer.atom_id;
            seller_atom.atom_id = transaction.seller.atom_id;
            transaction_atom.atom_id = transaction.atom_id;
            transaction_atom.good = good_atom;
            transaction_atom.buyer = buyer_atom;
            transaction_atom.seller = seller_atom;
            transaction_atom.price = transaction.price;
            transaction_atom.quantity = transaction.quantity;
            return transaction_atom;
          })
          .subscribe(transaction => {
            this.compoundTransaction.transactions.push(transaction);
          });
      });
  }
}
