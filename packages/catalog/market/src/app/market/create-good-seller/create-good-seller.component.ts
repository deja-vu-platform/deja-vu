import { Component, Input } from '@angular/core';

import { Good, Party } from "../shared/market.model";

@Component({
  selector: 'market-create-good-seller',
  templateUrl: './create-good-seller.component.html',
  styleUrls: ['./create-good-seller.component.css'],
})
export class CreateGoodSellerComponent {
  @Input() good: Good;
  @Input() seller: Party;

  constructor(private _graphQlService: GraphQlService) {}

  dvAfterInit() {
    if (this.good.atom_id) {
      this.fetch();
    }

    this.submit_ok.on_change(() => {
      if (this.seller.atom_id) {
        this._graphQlService
        .get(`
          good_by_id(atom_id: "${this.good.atom_id}") {
            updateGood(
              seller_id: "${this.seller.atom_id}"
            )
          }
        `)
        .subscribe(_ => undefined);
      }
    });
  }

  private fetch() {
    this._graphQlService
      .get(`
        good_by_id(atom_id: "${this.good.atom_id}") {
          seller{atom_id}
        }
      `)
    .map(data => data.good_by_id)
    .subscribe(good => {
      if (good.seller)
        this.seller.atom_id = good.seller.atom_id;
    });
  }
}
