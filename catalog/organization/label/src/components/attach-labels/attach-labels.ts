import {ElementRef, ViewChild} from "@angular/core";
import "rxjs/add/operator/toPromise";
import * as _u from "underscore";

import {Widget, Field, PrimitiveAtom, AfterInit} from "client-bus";
import {GraphQlService} from "gql";

import {ItemAtom, Label} from "../../shared/data";
import Select2 from "../_shared/select2";
import {waitFor} from "../_shared/utils";

@Widget({fqelement: "Label", ng2_providers: [GraphQlService]})
export class AttachLabelsComponent implements AfterInit {
  @Field("Item") item: ItemAtom;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;

  @ViewChild("select") select: ElementRef;

  select2: Select2;
  // prevent race conditions since submit has two async steps
  didSubmit: boolean = false;

  constructor(
    private _graphQlService: GraphQlService
  ) {}

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
            this.select2 = new Select2(this.select, options);
          });
      });

    this.submit_ok.on_change(() => {
      if (this.submit_ok.value === false) return;

      Promise.all<Label>(
          _u.chain(this.select2.getValues())
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
          })
          .then(() => {
            this.didSubmit = true;
          });
    });

    this.submit_ok.on_after_change(() => {
      waitFor(this, "didSubmit").then(() => {
        this.item.atom_id = undefined;
        this.item.labels = [];
        this.select2.setValues([]);
        this.didSubmit = false;
      });
    });
  }
}
