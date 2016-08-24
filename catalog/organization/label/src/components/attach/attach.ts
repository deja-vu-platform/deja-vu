import {HTTP_PROVIDERS} from "angular2/http";

import {Item, Label} from "../../shared/label";
import {GraphQlService} from "gql";

import {Widget} from "client-bus";


@Widget({
  template: "",
  ng2_providers: [GraphQlService, HTTP_PROVIDERS]
})
export class AttachComponent {
  private _item: Item;
  private _labels: Label[];
  private _ready = false;

  constructor(private _graphQlService: GraphQlService) {}

  get item() {
    return this._item;
  }

  set item(item: Item) {
    if (!item) return;
    console.log("got item " + item);
    this._item = item;
    this._maybe_attach();
  }

  get labels() {
    return this._labels;
  }

  set labels(labels: Label[]) {
    if (!labels) return;
    console.log("got labels " + JSON.stringify(labels));
    this._labels = labels;
    this._maybe_attach();
  }

  private _maybe_attach() {
    if (!this._ready) this._ready = true;
    if (this._ready) {
      this._attach(this._item, this._labels).subscribe(res => undefined);
    }
  }

  private _attach(item: Item, labels: Label[]): any {
    return this._graphQlService.post(`{
      item(name: "${name}") {
        attach_labels(labels: "${labels}")
      }
    }`);
  }
}
