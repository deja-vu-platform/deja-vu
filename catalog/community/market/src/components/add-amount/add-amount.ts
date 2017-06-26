import {GraphQlService} from "gql";

import {Widget} from "client-bus";


@Widget({
  fqelement: "Market",
  ng2_providers: [GraphQlService]
})
export class AddAmountComponent {
  party = {atom_id: undefined};
  amount: number;

  constructor(private _graphQlService: GraphQlService) {}

  onSubmit() {
    if (!this.party.atom_id) return;

    this._graphQlService
      .post(`
        AddAmount(amount: ${this.amount}, party_id: "${this.party.atom_id}")
      `)
      .subscribe(_ => {
        this.amount = 0;
      })
    ;
  }
}
