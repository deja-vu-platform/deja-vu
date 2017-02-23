import {ElementRef} from "@angular/core";

import {GraphQlService} from "gql";

import {Widget} from "client-bus";


@Widget({
  fqelement: "dv-organization-event",
  ng2_providers: [GraphQlService],
  styles: [``]
})
export class NewWeeklyEventComponent {
  starts_on: string = "";
  ends_on: string = "";
  start_time: string = "";
  end_time: string = "";
  weeklyEvent = {atom_id: undefined};

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

    startsOnText["value"] = "";
    endsOnText["value"] = "";
    startTimeText["value"] = "";
    endTimeText["value"] = "";

    this._graphQlService
      .post(`
        newWeeklyPublicEvent(
          starts_on: "${this.starts_on}", ends_on: "${this.ends_on}",
          start_time: "${this.start_time}", end_time: "${this.end_time}") {
          atom_id
        }
      `)
      .subscribe(atom_id => {
        this.weeklyEvent.atom_id = atom_id;
      });
  }

  update(e) {
    console.log(e);
  }

  ngAfterViewInit() {
    this._loadScript("bootstrap-datepicker/bootstrap-datepicker.min.js");
    this._loadScript("bootstrap-timepicker/bootstrap-timepicker.min.js");
  }

  _loadScript(src: string) {
    const s = document.createElement("script");
    s.type = "text/javascript";
    s.src = "node_modules/dv-organization-event/lib/components/" +
      "new-weekly-event/vendor/" + src;
    this._elementRef.nativeElement.appendChild(s);
  }

  /**
   * Fix an inconsistency with the current time appearing in time boxes when
   * they are clicked.
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
