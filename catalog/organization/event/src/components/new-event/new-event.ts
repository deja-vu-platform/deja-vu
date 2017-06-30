import {ElementRef} from "@angular/core";

import {GraphQlService} from "gql";

import {Widget, Field} from "client-bus";

import {EventAtom} from "../../shared/data";



@Widget({
  fqelement: "Event",
  ng2_providers: [GraphQlService],
  styles: [``]
})
export class NewEventComponent {
  starts_on: string = "";
  ends_on: string = "";
  start_time: string = "";
  end_time: string = "";
  @Field("Event") event: EventAtom;

  constructor(
      private _graphQlService: GraphQlService,
      private _elementRef: ElementRef) {}

  onSubmit() {
    let startsOnText: Element = document.getElementById("starts-on-text");
    let endsOnText: Element = document.getElementById("ends-on-text");
    let startTimeText: Element = document.getElementById("start-time-text");
    let endTimeText: Element = document.getElementById("end-time-text");

    this.starts_on = startsOnText["value"];
    this.ends_on = endsOnText["value"];
    this.start_time = startTimeText["value"];
    this.end_time = endTimeText["value"];

    this._graphQlService
      .post(`
        newPublicEvent(
          starts_on: "${this.starts_on}", ends_on: "${this.ends_on}",
          start_time: "${this.start_time}", end_time: "${this.end_time}") {
          atom_id
        }
      `)
      .subscribe(atom_id => {
        this.event.atom_id = atom_id;

        // Clear out the fields on success
        startsOnText["value"] = "";
        endsOnText["value"] = "";
        startTimeText["value"] = "";
        endTimeText["value"] = "";

        this.starts_on = "";
        this.ends_on = "";
        this.start_time = "";
        this.end_time = "";
      });
  }

  update(e) {
    console.log(e);
  }

  ngAfterViewInit() {
    // Datepicker and timepicker scripts need to be loaded this way
    this._loadScript("bootstrap-datepicker/bootstrap-datepicker.min.js");
    this._loadStyle("bootstrap-datepicker/bootstrap-datepicker3.min.css");

    this._loadScript("bootstrap-timepicker/bootstrap-timepicker.min.js");
    this._loadStyle("bootstrap-timepicker/bootstrap-timepicker.css");
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

  /**
   * Fix an inconsistency with the current time appearing in time boxes when
   * they are clicked. The inconsistency is that when a user clicks the time
   * control for the first time, the current (rounded) time appears.
   * Subsequently, after the time is cleared, this doesn't happen anymore.
   */
  timeClickHandler(event: Event) {
    const MINUTE_ROUNDING_FACTOR = 15;
    const FIRST_PM_HOUR = 12;

    if (!event.srcElement["value"]) {
      // Get a string containing the current time
      let currentTime: Date = new Date();

      // Note: The behavior of the control is a bit weird in that it rounds up
      // to the nearest 15 minutes. We need to do that to keep consistent
      let minutes: number = currentTime.getMinutes();
      if (minutes % MINUTE_ROUNDING_FACTOR !== 0) {
        // Pushing the time forward wraps properly
        currentTime.setMinutes(minutes
          + (MINUTE_ROUNDING_FACTOR
            - (minutes % MINUTE_ROUNDING_FACTOR)));
        minutes = currentTime.getMinutes();
      }

      let totalHours: number = currentTime.getHours();
      let actualHours: number = totalHours % FIRST_PM_HOUR;
      let amPm: string = totalHours >= FIRST_PM_HOUR ? "PM" : "AM";
      event.srcElement["value"] = actualHours.toString() + ":"
        + minutes.toString() + " " + amPm;
    }
  }
}
