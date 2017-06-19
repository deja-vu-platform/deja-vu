import {ElementRef} from "@angular/core";

import {GraphQlService} from "gql";

import {Widget} from "client-bus";


@Widget({
  fqelement: "Event",
  ng2_providers: [GraphQlService],
  styles: [``]
})
export class NewEventButtonComponent {
  submit_ok = {value: false};

  constructor(
      private _graphQlService: GraphQlService,
      private _elementRef: ElementRef) {}

  submit() {
    this.submit_ok.value = true;
  }

  valid() {
    return true; // TODO: actually validate
  }

  _loadScript(src: string) {
    const s = document.createElement("script");
    s.type = "text/javascript";
    s.src = "node_modules/dv-organization-event/lib/components/" +
      "new-event/vendor/" + src;
    this._elementRef.nativeElement.appendChild(s);
  }

  _loadStyle(href: string) {
    const s = document.createElement("link");
    s.type = "text/css";
    s.rel = "stylesheet";
    s.href = "node_modules/dv-organization-event/lib/components/" +
      "new-event/vendor/" + href;
    this._elementRef.nativeElement.appendChild(s);
  }
}
