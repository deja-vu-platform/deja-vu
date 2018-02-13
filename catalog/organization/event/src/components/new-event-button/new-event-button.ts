import {ElementRef} from "@angular/core";

import {GraphQlService} from "gql";

import {Widget, Field, PrimitiveAtom} from "client-bus";

import {EventAtom} from "../../shared/data";


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
  @Field("Event") event: EventAtom;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;

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
      });
  }

  valid() {
    return (
      this.startsOnText["value"] &&
      this.endsOnText["value"] &&
      this.startTimeText["value"] &&
      this.endTimeText["value"]
    );
  }
}
