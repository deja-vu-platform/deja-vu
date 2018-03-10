import {GraphQlService} from "gql";
import {Widget, ClientBus, Field} from "client-bus";
import {
  MarketAtom,
  PartyAtom,
  GoodAtom,
  TransactionAtom
} from "../../shared/data";

import {Observable} from "rxjs/Observable";
import "rxjs/add/observable/from";
import "rxjs/add/operator/map";
import "rxjs/add/operator/mergeMap";

@Widget({
  fqelement: "Market",
  ng2_providers: [GraphQlService]
})
export class ShowAllTransactionsComponent {
  @Field("Market") market: MarketAtom;
  allTransactions = [];

  constructor(
    private _graphQlService: GraphQlService,
    private _clientBus: ClientBus
  ) {}

  dvAfterInit() {
    if (!this.market.atom_id) {
      return;
    }
    this.allTransactions = [];
    this._graphQlService
      .get(`
        TransactionsByMarket(
          market_id: "${this.market.atom_id}"
        ) {
          atom_id,
          good {
            atom_id,
            name
          },
          buyer {
            atom_id
          },
          seller {
            atom_id
          },
          price,
          quantity,
          status
        }
      `)
      .map(data => data.TransactionsByMarket)
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
        transaction_atom.status = transaction.status;
        return transaction_atom;
      })
      .subscribe(transaction => {
        this.allTransactions.push(transaction);
      });
  }
}
