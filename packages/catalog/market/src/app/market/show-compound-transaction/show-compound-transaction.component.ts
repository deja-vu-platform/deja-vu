import {GraphQlService} from "gql";
import {Widget, ClientBus, Field, AfterInit} from "client-bus";
import {
  CompoundTransactionAtom,
  GoodAtom,
  PartyAtom,
  TransactionAtom
} from "../../shared/data";

import "rxjs/add/observable/from";
import "rxjs/add/operator/map";


@Widget({
  fqelement: "Market",
  ng2_providers: [GraphQlService]
})
export class ShowCompoundTransactionComponent implements AfterInit {
  @Field("CompoundTransaction") compoundTransaction: CompoundTransactionAtom;

  constructor(
    private _graphQlService: GraphQlService,
    private _clientBus: ClientBus
  ) {}

  dvAfterInit() {
    if (!this.compoundTransaction.atom_id) return;
    this._graphQlService
      .get(`
        compoundtransaction_by_id(
          atom_id: "${this.compoundTransaction.atom_id}") {
          total_price,
          transactions {
            atom_id,
            good { atom_id, name },
            buyer { atom_id },
            price,
            quantity,
            status
          }
        }
      `)
      // can't get seller {atom_id} in query above if seller does not exist
      .map(data => data.compoundtransaction_by_id)
      .subscribe(compoundTransaction => {
        this.compoundTransaction.total_price = compoundTransaction.total_price;

        this.compoundTransaction.transactions = [];
        compoundTransaction.transactions
          .map((transaction: TransactionAtom) => {
            const transaction_atom = this.
              _clientBus.new_atom<TransactionAtom>("Transaction");
            transaction_atom.atom_id = transaction.atom_id;
            transaction_atom.price = transaction.price;
            transaction_atom.quantity = transaction.quantity;
            transaction_atom.status = transaction.status;

            const good_atom = this._clientBus.new_atom<GoodAtom>("Good");
            good_atom.atom_id = transaction.good.atom_id;
            good_atom.name = transaction.good.name;
            transaction_atom.good = good_atom;

            if (transaction.seller) {
              const seller_atom = this._clientBus.new_atom<PartyAtom>("Party");
              seller_atom.atom_id = transaction.seller.atom_id;
              transaction_atom.seller = seller_atom;
            }
            if (transaction.buyer) {
              const buyer_atom = this._clientBus.new_atom<PartyAtom>("Party");
              buyer_atom.atom_id = transaction.buyer.atom_id;
              transaction_atom.buyer = buyer_atom;
            }

            return transaction_atom;
          })
          .forEach(transaction => {
            this.compoundTransaction.transactions.push(transaction);
          });
      });
  }
}
