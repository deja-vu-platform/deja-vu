import {ElementRef} from "@angular/core";
import {} from "@types/select2";

import {loadScript, loadStylesheet, waitFor} from "./utils";

// Note: Using legacy modules which cannot be imported
// Re-do with angular packages once this is possible

// Instance of a Select2 box
// (jQuery replacement for select box -- https://select2.github.io/)
// Warning: make sure Select2.loadAPI() has resolved before instantiating
export default class Select2 {
  private static scriptSrc =
    "https://cdn.jsdelivr.net/select2/4.0.3/js/select2.min.js";
  private static stylePath =
    "https://cdn.jsdelivr.net/select2/4.0.3/css/select2.min.css";

  $select: any; // jQuery object

  static loadAPI(): Promise<{}> {
    return waitFor(window, "jQuery")
      .then(_ => {
        // insert tags to load API and styles from CDN
        if (!window[Select2.scriptSrc] && !window["jQuery"].fn.select2) {
          loadScript(Select2.scriptSrc);
        }
        if (!window[Select2.stylePath]) {
          loadStylesheet(Select2.stylePath);
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
