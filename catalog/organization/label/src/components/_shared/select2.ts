import {ElementRef} from "@angular/core";
import {} from "@types/select2";

import {loadScript, loadStylesheet, waitFor} from "./utils";

const scriptSrc = "https://cdn.jsdelivr.net/select2/4.0.3/js/select2.min.js";
const stylePath = "https://cdn.jsdelivr.net/select2/4.0.3/css/select2.min.css";

// Instance of a Select2 box
// (jQuery replacement for select box -- https://select2.github.io/)
// Warning: make sure Select2.loadAPI() has resolved before instantiating
export default class Select2 {
  $select: any; // jQuery object

  static loadAPI(): Promise<{}> {
    return waitFor(window, "jQuery")
      .then(_ => {
        // insert tags to load API and styles from CDN
        if (!window[scriptSrc] && !window["jQuery"].fn.select2) {
          loadScript(scriptSrc);
        }
        if (!window[stylePath]) {
          loadStylesheet(stylePath);
        }
        return waitFor(window["jQuery"].fn, "select2");
      });
  }

  constructor(select: ElementRef, options: Select2Options) {
    this.$select = window["jQuery"](select.nativeElement);
    this.$select.select2(options);
  }

  getValues(): string[] {
    return this.$select.select2("data").map(datum => datum.text);
  }

  setValues(values: string[]): void {
    this.$select.val(values).trigger("change");
  }
}
