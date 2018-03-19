import { Component, Input } from '@angular/core';

import { Good } from "../shared/market.model";

@Component({
  selector: 'market-update-good',
  templateUrl: './update-good.component.html',
  styleUrls: ['./update-good.component.css'],
})
export class UpdateGoodComponent {
  @Input() good: Good;
  @Input() name: string;

  constructor(private _graphQlService: GraphQlService) {}

  dvAfterInit() {
    if (this.good.atom_id) {
      this.fetch();
    }

    this.submit_ok.on_change(() => {
      if (this.name) {
        this._graphQlService
        .get(`
          good_by_id(atom_id: "${this.good.atom_id}") {
            updateGood(
              name: "${this.name.value}"
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
          name
        }
      `)
    .map(data => data.good_by_id)
    .subscribe(good => {
      if (good.name)
        this.name.value = good.name;
    });
  }
}
