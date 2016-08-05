/// <reference path="../../../typings/underscore/underscore.d.ts" />
import {Component, provide} from "angular2/core";
import {HTTP_PROVIDERS} from "angular2/http";
import {ClientBus} from "client-bus";

import {Item} from "../../shared/label";
import {GraphQlService} from "../shared/graphql";

import * as _u from "underscore";


@Component({
  selector: "labels-text",
  templateUrl: "./components/labels-text/labels-text.html",
  inputs: ["item"],
  providers: [
    provide("fqelement", {useValue: "dv-organization-label"}),
    ClientBus, GraphQlService, HTTP_PROVIDERS]
})
export class LabelsTextComponent {
  private _item: Item = {name: "", labels: []};
  private _labels_text: string = "";

  constructor(
      private _client_bus: ClientBus,
      private _graphQlService: GraphQlService) {
    _client_bus.on("submit", _ => this.onSubmit());
  }

  get item() {
    return this._item;
  }

  set item(item: Item) {
    if (item === undefined) return;
    this._item = item;
  }

  get labels_text() {
    return this._labels_text;
  }

  set labels_text(labels_text: string) {
    if (labels_text === undefined) return;
    this._labels_text = labels_text;
  }

  // On submit will attach labels to the item
  onSubmit() {
    this.item.labels = [];
    console.log("On submit at labels-text");
    Promise.all(
        _u.chain(this._labels_text.split(","))
          .map(l => l.trim())
          .uniq()
          .map(
              l => this._graphQlService
                .get(`{
                  createOrGetLabel(name: "${l}") {
                    atom_id,
                    items
                  }
                }`)
                .subscribe(({atom_id, items}) => {
                  const ret = this._client_bus.new_atom("Label");
                  ret.atom_id = atom_id;
                  ret.name = l;
                  items.push(this.item);
                  ret.items = items;
                  this.item.labels.push(ret);
                })
                )
          .value()
          )
          .then(_ => this._graphQlService.post(`{
      item(name: "${this.item.name}") {
        attach_labels(${this._graphQlService.plist(this.item.labels)})
      }
    }`));
  }
}
