import {Label} from "../../shared/label";
import {GraphQlService} from "gql";

import "rxjs/add/operator/toPromise";

import * as _u from "underscore";

import {Widget} from "client-bus";


@Widget({
  fqelement: "Label",
  ng2_providers: [GraphQlService]
})
export class AttachLabelsComponent {
  item = {labels: [], atom_id: undefined};
  labels_text: string = "";
  submit_ok = {
    value: false, on_change: _ => undefined, on_after_change: _ => undefined
  };

  constructor(private _graphQlService: GraphQlService) {}

  // On submit will attach labels to the item
  dvAfterInit() {
    this.submit_ok.on_change(() => {
      if (this.submit_ok.value === false) return;

      console.log("On submit at attach-labels");
      return Promise.all<Label>(
          _u.chain(this.labels_text.split(","))
            .map(l => l.trim())
            .uniq()
            .map(l => this._graphQlService
                    .post(`
                      createOrGetLabel(name: "${l}") {
                        atom_id
                      }
                    `)
                    .toPromise()
                    .then(_ => ({name: l}))
                 )
            .value()
          )
          .then((labels: Label[]) => {
            this.item.labels = labels;
            const attach_labels_str = this._graphQlService
                .list(_u.map(labels, l => l.name));
            return this._graphQlService
              .get(`
                item_by_id(atom_id: "${this.item.atom_id}") {
                  attach_labels(labels: ${attach_labels_str})
                }
              `)
              .toPromise();
          });
    });

    this.submit_ok.on_after_change(() => {
      this.item.atom_id = undefined;
      this.item.labels = [];
      this.labels_text = "";
    });
  }
}
