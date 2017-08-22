import {ElementRef} from "@angular/core";
import {} from "@types/typeahead";

import {insertTag, waitFor} from "./utils";

const scriptSrc = "https://cdnjs.cloudflare.com/ajax/libs/corejs-typeahead/"+
  "1.1.1/typeahead.bundle.min.js";
const stylePath = "node_modules/dv-organization-group/lib/"+
  "components/_shared/typeahead.css";


// Instance of a Twitter Typeahead using a single string dataset
// Warning: make sure Typeahead.loadAPI() has resolved before instantiating
export default class Typeahead {
  $typeahead: any; // jQuery object
  bloodhound: Bloodhound<string>;

  static loadAPI(): Promise<void> {
    return waitFor(window, "jQuery")
      .then(_ => {
        // insert tags to load API and styles from CDN
        if (
          !window[scriptSrc] &&
          !window["jQuery"].fn.typeahead &&
          !window["Bloodhound"]
        ) {
          insertTag("script", {
            src: scriptSrc,
            id: scriptSrc,
            async: true,
            defer: true
          });
        }
        if (!window[stylePath]) {
          insertTag("link", {
            type: "text/css",
            rel: "stylesheet",
            href: stylePath,
            id: stylePath
          });
        }
        return Promise.all([
          waitFor(window["jQuery"].fn, "typeahead"),
          waitFor(window, "Bloodhound")
        ]).then(_ => null);
      });
  }

  constructor(wrapper: ElementRef, data: string[]) {
    const $ = window["jQuery"];
    const Bloodhound = window["Bloodhound"];

    // constructs the suggestion engine
    const bloodhoundOptions: Bloodhound.BloodhoundOptions<string> = {
      datumTokenizer: Bloodhound.tokenizers.whitespace,
      queryTokenizer: Bloodhound.tokenizers.whitespace,
      local: data
    };
    this.bloodhound = new Bloodhound(bloodhoundOptions);

    // installs typeahead in DOM element
    const typeaheadOptions: Twitter.Typeahead.Options = {
      hint: true,
      highlight: true,
      minLength: 1
    };
    const dataset: Twitter.Typeahead.Dataset<string> = {
      name: "data",
      source: this.bloodhound
    };
    const $wrapper = $(wrapper.nativeElement);
    $wrapper.children("input").typeahead(typeaheadOptions, dataset);
    this.$typeahead = $wrapper.children(".tt-input");
  }

  getValue(): string {
    return this.$typeahead.typeahead("val");
  }

  setValue(val: string): void {
    this.$typeahead.typeahead("val", val);
  }

  updateData(data: string[]) {
    this.bloodhound.clear();
    this.bloodhound.add(data);
  }
}
