import {GraphQlService} from "gql";

import {Widget} from "client-bus";


@Widget({
  fqelement: "dv-organization-market",
  ng2_providers: [GraphQlService]
})
export class ShowBalanceComponent {
  party = {atom_id: undefined, balance: undefined};

  constructor(private _graphQlService: GraphQlService) {}

  dvAfterInit() {
    if (!this.party.atom_id) return;

    this._graphQlService
      .get(`
        party_by_id(atom_id: "${this.party.atom_id}"){
          atom_id,
          balance
        }
      `)
      .subscribe(data => {
        this.party.balance = data.party_by_id.balance;
      });
  }
}
