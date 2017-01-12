import {Widget} from "client-bus";

import {GraphQlService} from "gql";


@Widget({
  ng2_providers: [GraphQlService],
  template: `
    <ul *ngIf="item.labels && item.labels.length > 0" class="row"
     style="list-style-type: none; padding-top: 10px; padding-bottom: 10px;">
      <li *ngFor="#label of item.labels" class="label label-primary">
        {{label.name}}
      </li>
    </ul>
  `
})
export class LabelsComponent {
  item = {on_change: undefined, atom_id: undefined, labels: undefined};
  fetched = false;
  constructor(private _graphQlService: GraphQlService) {}

  dvAfterInit() {
    const update_labels = () => {
      if (this.item.atom_id === undefined || this.fetched) return;
      this.fetched = true;

      console.log("Fetching labels");
      return this._graphQlService
        .get(`
          item_by_id(atom_id: "${this.item.atom_id}") {
            labels {
              name
            }
          }
        `)
        .map(data => data.item_by_id)
        .subscribe(item => {
          this.item.labels = item.labels;
        });
    };
    update_labels();
    this.item.on_change(update_labels);
  }
}
