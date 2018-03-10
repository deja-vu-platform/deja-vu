import {GraphQlService} from "gql";

import {Widget, ClientBus, Field} from "client-bus";

import {GoodAtom, TransactionAtom} from "../../shared/data";

import "rxjs/add/operator/map";

@Widget({
  fqelement: "Market",
  template: `x{{transaction.quantity}} {{transaction.good?.name}} ` +
  `@{{transaction.price}}`,
  ng2_providers: [GraphQlService]
})
export class ShowTransactionComponent {
  @Field("Transaction") transaction: TransactionAtom;

  constructor(
    private _graphQlService: GraphQlService,
    private _clientBus: ClientBus) {}

  dvAfterInit() {
    if (!this.transaction.atom_id || !this.transaction.good) {
      return;
    }

    this._graphQlService
      .get(`
        transaction_by_id(atom_id: "${this.transaction.atom_id}") {
          good {
            atom_id,
            name
          },
          price,
          quantity
        }
      `)
      .map(data => data.transaction_by_id)
      .subscribe(transaction => {
        if (!this.transaction.good)
          this.transaction.good = this._clientBus.new_atom<GoodAtom>("Good");
        this.transaction.good.atom_id = transaction.good.atom_id;
        this.transaction.good.name = transaction.good.name;
        this.transaction.price = transaction.price;
        this.transaction.quantity = transaction.quantity;
      });
  }
}
