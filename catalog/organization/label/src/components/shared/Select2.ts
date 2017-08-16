import {loadScript, loadStylesheet, waitFor} from "./utils";

const scriptSrc = "https://cdn.jsdelivr.net/select2/4.0.3/js/select2.min.js";
const stylePath = "https://cdn.jsdelivr.net/select2/4.0.3/css/select2.min.css";

// Instance of a Select2 box
// Warning: make sure Select2.loadAPI() has resolved before instantiating
export default class Select2 {
  selectID: string;

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

  constructor(selectID: string, options: object) {
    this.selectID = selectID;
    window["jQuery"](`#${this.selectID}`)
      .select2(options);
  }

  getValues(): string[] {
    return window["jQuery"](`#${this.selectID}`)
      .select2("data")
      .map(datum => datum.text);
  }

  setValues(vals: string[] | null): void {
    window["jQuery"](`#${this.selectID}`)
      .val(vals)
      .trigger("change");
  }
}
