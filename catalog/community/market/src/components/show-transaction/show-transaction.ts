import {GraphQlService} from "gql";

import {Widget, Field} from "client-bus";

import {TransactionAtom} from "../../shared/data";

import "rxjs/add/operator/map";

@Widget({
  fqelement: "Market",
  template: `x{{transaction.quantity}} {{good_name}} ` +
  `@{{transaction.price}}`,
  ng2_providers: [GraphQlService]
})
export class ShowTransactionComponent {
  @Field("Transaction") transaction: TransactionAtom;
  // Use good_name in template instead of transaction.good.name so that it
  // doesn't crash if good is undefined
  good_name = "";

  constructor(private _graphQlService: GraphQlService) {}

  dvAfterInit() {
    if (!this.transaction.atom_id || !this.transaction.good) {
      return;
    }

    this._graphQlService
      .get(`
        transaction_by_id(atom_id: "${this.transaction.atom_id}") {
          good {
            name
          },
          price,
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
            this.good_name = name;
            this.transaction.price = transaction_by_id.price;
            this.transaction.quantity = transaction_by_id.quantity;
          });
      });
  }
}
