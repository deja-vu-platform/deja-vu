import {GraphQlService} from "gql";

import {Widget, Atom, Field} from "client-bus";


export interface PartyAtom extends Atom { balance: number; }

@Widget({fqelement: "Market", ng2_providers: [GraphQlService]})
export class ShowBalanceComponent {
  @Field("Party") party: PartyAtom;

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
