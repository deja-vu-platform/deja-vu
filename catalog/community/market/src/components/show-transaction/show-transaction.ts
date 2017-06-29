import {GraphQlService} from "gql";

import {Widget, ClientBus} from "client-bus";

import "rxjs/add/operator/map";

@Widget({
  fqelement: "Market",
  template: `x{{transaction.quantity}} {{transaction.good.name}} ` +
  `@{{transaction.unit_price}}`,
  ng2_providers: [GraphQlService]
})
export class ShowTransactionComponent {
  transaction = {
  atom_id: "",
    good: {
      name: ""
    },
    unit_price: 0,
    quantity: 0
  };

  constructor(
    private _graphQlService: GraphQlService,
    private _clientBus: ClientBus
  ) {}

  dvAfterInit() {
    if (!this.transaction.atom_id || this.transaction.good.name) {
      return;
    }

    this._graphQlService
      .get(`
        transaction_by_id(atom_id: "${this.transaction.atom_id}") {
          good {
            name
          },
          unit_price,
          quantity
        }
      `)
      .map(data => data.transaction_by_id)
      .subscribe(transaction_by_id => {
        this._graphQlService
          .get(`
            good_by_id(
              atom_id: "${transaction_by_id.good.atom_id}"
            ) {
              name
            }
          `)
          .map(data => data.good_by_id.name)
          .subscribe(name => {
            this.transaction.good.name = name;
            this.transaction.unit_price = transaction_by_id.unit_price;
            this.transaction.quantity = transaction_by_id.quantity;
          });
      });
  }
}
