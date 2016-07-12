import {Component, provide} from "angular2/core";
import {HTTP_PROVIDERS} from "angular2/http";
import {ClientBus} from "client-bus";

import {Item} from "../../shared/label";


@Component({
  selector: "labels-text",
  templateUrl: "./components/labels-text/labels-text.html",
  inputs: ["item"],
  providers: [
    provide("fqelement", {useValue: "dv-organization-label"}),
    ClientBus, HTTP_PROVIDERS]
})
export class LabelsTextComponent {
  private _item: Item = {name: "", labels: []};
  private _labels_text: string = "";

  constructor(private _client_bus: ClientBus) {}

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
    console.log("got labels_text " + labels_text);
    this._labels_text = labels_text;
    this.item.labels = [];
    new Set(this._labels_text.split(",").map(l => l.trim()))
      .forEach(
          l => {
            const ret = this._client_bus.new_atom("Label");
            ret.name = l;
            ret.items = [this.item];
            this.item.labels.push(ret);
          });
  }
}
