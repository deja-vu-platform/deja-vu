import "rxjs/add/operator/toPromise";
import * as _u from "underscore";

import {Widget, Field, PrimitiveAtom, AfterInit} from "client-bus";
import {GraphQlService} from "gql";

import {ItemAtom, Label} from "../../shared/data";
import Select2 from "../shared/Select2";
import {uuidv4} from "../shared/utils";


@Widget({fqelement: "Label", ng2_providers: [GraphQlService]})
export class AttachLabelsComponent implements AfterInit {
  @Field("Item") item: ItemAtom;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;

  selectID = uuidv4();
  selectLabels: Select2;

  constructor(private _graphQlService: GraphQlService) {}

  // On submit will attach labels to the item
  dvAfterInit() {
    this._graphQlService
      .get(`
        label_all {
          name
        }
      `)
      .subscribe(data => {
        const labels = data.label_all.map((label, idx) => {
          return {id: idx.toString(), text: label.name};
        });
        const options = {
          data: labels,
          tags: true,
          tokenSeparators: [","]
        };
        Select2.loadAPI()
          .then(() => {
            this.selectLabels = new Select2(this.selectID, options);
          });
      });

    this.submit_ok.on_change(() => {
      if (this.submit_ok.value === false) return;

      return Promise.all<Label>(
          _u.chain(this.selectLabels.getValues())
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
      this.selectLabels.setValues(null);
    });
  }
}
