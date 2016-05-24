import {Component} from "angular2/core";

import {Item} from "../../shared/label";


@Component({
  selector: "labels-text",
  templateUrl: "./components/labels-text/labels-text.html",
  inputs: ["item"]
})
export class LabelsTextComponent {
  private _item: Item = {name: "", labels: []};
  private _labels_text: string = "";

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
    this.item.labels = this._labels_text.split(",").map(l => ({name: l}));
  }
}
