import {GraphQlService} from "gql";

import {Widget, ClientBus} from "client-bus";

import {Observable} from "rxjs/Observable";
import "rxjs/add/observable/from";
import "rxjs/add/operator/map";
import "rxjs/add/operator/mergeMap";

export interface Party {
  atom_id: string;
}

export interface Good {
  atom_id: string;
  name: string;
  price: number;
  seller: Party;
  quantity: number;
}

export interface Transaction {
  atom_id: string;
  good: Good;
  buyer: Party;
  seller: Party;
  unit_price: number;
  quantity: number;
}

@Widget({
  fqelement: "Market",
  ng2_providers: [GraphQlService]
})
export class ShowAllTransactionsComponent {
  market = {atom_id: ""};
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
          unit_price,
          quantity
        }
      `)
      .map(data => data.TransactionsByMarket)
      .flatMap((transactions, unused_ix) => Observable.from(transactions))
      .map((transaction: Transaction) => {
        const transaction_atom = this._clientBus.new_atom("Transaction");
        const good_atom: Good = this._clientBus.new_atom("Good");
        const seller_atom: Party = this._clientBus.new_atom("Party");
        const buyer_atom: Party = this._clientBus.new_atom("Party");
        good_atom.atom_id = transaction.good.atom_id;
        good_atom.name = transaction.good.name;
        buyer_atom.atom_id = transaction.buyer.atom_id;
        seller_atom.atom_id = transaction.seller.atom_id;
        transaction_atom.atom_id = transaction.atom_id;
        transaction_atom.good = good_atom;
        transaction_atom.buyer = buyer_atom;
        transaction_atom.seller = seller_atom
        transaction_atom.unit_price = transaction.unit_price;
        transaction_atom.quantity = transaction.quantity;
        return transaction_atom;
      })
      .subscribe(transaction => {
        this.allTransactions.push(transaction);
      })
    ;
  }
}
