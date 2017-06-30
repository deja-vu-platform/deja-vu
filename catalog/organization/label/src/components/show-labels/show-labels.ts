import "rxjs/add/operator/toPromise";
import {Widget, Field, AfterInit} from "client-bus";
import {ItemAtom} from "../shared/data";

import {GraphQlService} from "gql";


@Widget({
  fqelement: "Label",
  ng2_providers: [GraphQlService],
  template: `
    <ul *ngIf="item.labels && item.labels.length > 0" class="row"
     style="list-style-type: none; padding-top: 10px; padding-bottom: 10px;">
      <li *ngFor="let label of item.labels" class="label label-primary">
        {{label.name}}
      </li>
    </ul>
  `
})
export class ShowLabelsComponent implements AfterInit {
  @Field("Item") item: ItemAtom;
  fetched = false;

  constructor(private _graphQlService: GraphQlService) {}

  dvAfterInit() {
    const update_labels = () => {
      if (this.item.atom_id === undefined || this.fetched) return;
      this.fetched = true;

      return this._graphQlService
        .get(`
          item_by_id(atom_id: "${this.item.atom_id}") {
            labels {
              name
            }
          }
        `)
        .toPromise()
        .then(data => data.item_by_id)
        .then(item => {
          this.item.labels = item.labels;
        });
    };
    update_labels();
    this.item.on_change(update_labels);
  }
}
