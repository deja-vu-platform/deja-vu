import { Component, Input } from '@angular/core';

import { Party } from "../shared/market.model";

@Component({
  selector: 'market-show-party',
  templateUrl: './show-party.component.html',
  styleUrls: ['./show-party.component.css'],
})
export class ShowPartyComponent {
  @Input() party: Party;

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
