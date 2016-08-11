/// <reference path="../../../typings/underscore/underscore.d.ts" />
import {Component, provide} from "angular2/core";
import {HTTP_PROVIDERS} from "angular2/http";
import {ClientBus} from "client-bus";

import {Item, Label} from "../../shared/label";
import {GraphQlService} from "../shared/graphql";

import "rxjs/add/operator/toPromise";

import * as _u from "underscore";


@Component({
  selector: "labels-text",
  templateUrl: "./components/labels-text/labels-text.html",
  providers: [
    provide("fqelement", {useValue: "dv-organization-label"}),
    ClientBus, GraphQlService, HTTP_PROVIDERS],
  inputs: ["item", "submitted"]
})
export class LabelsTextComponent {
  item: Item = {name: "", labels: []};
  labels_text: string = "";
  private _submitted;

  constructor(
      private _client_bus: ClientBus,
      private _graphQlService: GraphQlService) {}

  get submitted() { return this._submitted; }
  set submitted(submitted) {
    if (submitted !== undefined) {
      console.log("GOT SUBMITTEEDD on labels" + submitted.value);
      this._submitted = submitted;
      this._submitted.on_change(_ => {
        if (this._submitted.value) {
          this.onSubmit();
        }
      });
    }
  }

  // On submit will attach labels to the item
  onSubmit() {
    this.item.labels = [];
    console.log("On submit at labels-text");
    return Promise.all<Label>(
        _u.chain(this.labels_text.split(","))
          .map(l => l.trim())
          .uniq()
          .map(l => this._graphQlService
                  .post(`{
                    createOrGetLabel(name: "${l}") {
                      atom_id
                    }
                  }`)
                  .toPromise()
                  .then(({atom_id}) => {
                    const ret = this._client_bus.new_atom("Label");
                    ret.atom_id = atom_id;
                    ret.name = l;
                    return ret;
                  })
               )
          .value()
        )
        .then((labels: Label[]) => {
          this.item.labels = labels;
          const attach_labels_str = this._graphQlService
              .plist(_u.map(labels, l => _u.pick(l, "name")));
          return this._graphQlService
            .get(`{
              item_by_id(atom_id: "${this.item.atom_id}") {
                attach_labels(labels: ${attach_labels_str})
              }
            }`)
            .toPromise();
        });
  }
}
