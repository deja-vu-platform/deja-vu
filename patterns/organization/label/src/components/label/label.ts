import {Component, Output, EventEmitter} from "angular2/core";


@Component({
  selector: "labels",
  templateUrl: "./components/label/label.html",
})
export class LabelComponent {
  @Output() label = new EventEmitter();
  private _labels_text: string;

  get labels_text() {
    return this._labels_text;
  }

  set labels_text(labels_text: string) {
    if (!labels_text) return;
    console.log("got labels_text " + labels_text);
    this._labels_text = labels_text;
    this.label.emit(this._labels_text);
  }
}
