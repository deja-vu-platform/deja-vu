import {ElementRef} from "@angular/core";

import {GraphQlService} from "gql";

import {Widget} from "client-bus";


@Widget({
  fqelement: "Event",
  ng2_providers: [GraphQlService],
  styles: [``]
})
export class NewEventButtonComponent {
  startsOnText: Element;
  endsOnText: Element;
  startTimeText: Element;
  endTimeText: Element;
  event = {atom_id: undefined};
  submit_ok = {value: false};

  constructor(
    private _graphQlService: GraphQlService,
    private _elementRef: ElementRef
  ) {}


  dvAfterInit() {
    this.startsOnText = document.getElementById("starts-on-text");
    this.endsOnText = document.getElementById("ends-on-text");
    this.startTimeText = document.getElementById("start-time-text");
    this.endTimeText = document.getElementById("end-time-text");
  }

  submit() {
    this._graphQlService
      .post(`
        newPublicEvent(
          starts_on: "${this.startsOnText["value"]}",
          ends_on: "${this.endsOnText["value"]}",
          start_time: "${this.startTimeText["value"]}",
          end_time: "${this.endTimeText["value"]}") {
          atom_id
        }
      `)
      .subscribe(obj => {
        this.event.atom_id = obj.newPublicEvent.atom_id;
        this.submit_ok.value = !this.submit_ok.value;
      })
    ;
  }

  valid() {
    return (
      this.startsOnText["value"] &&
      this.endsOnText["value"] &&
      this.startTimeText["value"] &&
      this.endTimeText["value"]
    );
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
