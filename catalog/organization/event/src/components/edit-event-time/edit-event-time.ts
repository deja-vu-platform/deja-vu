import {ElementRef} from "@angular/core";

import {GraphQlService} from "gql";
import {Widget, Field, PrimitiveAtom, AfterInit} from "client-bus";

import {EventAtom} from "../../shared/data";


@Widget({
  fqelement: "Event",
  ng2_providers: [GraphQlService]
})
export class EditEventTimeComponent implements AfterInit {
  @Field("Event") event: EventAtom;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;
  startsOnText: Element;
  endsOnText: Element;
  startTimeText: Element;
  endTimeText: Element;

  updated = false;

  constructor(private _graphQlService: GraphQlService,
    private _elementRef: ElementRef) {}

  dvAfterInit() {
    this.submit_ok.on_change(() => this.updateEvent());
  }

  updateEvent() {
    if (this.updated) {
      return;
    }
    this.initFields();

    this._graphQlService
      .get(`
        event_by_id(atom_id: "${this.event.atom_id}") {
          updateEvent(
          starts_on: "${this.startsOnText["value"]}",
          ends_on: "${this.endsOnText["value"]}",
          start_time: "${this.startTimeText["value"]}",
          end_time: "${this.endTimeText["value"]}") {
            atom_id
          }
        }
      `)
      .subscribe(_ => {
        this.updated = true;
        this.event.start_date =
          `${this.startsOnText["value"]} ${this.startTimeText["value"]}`;
        this.event.end_date =
          `${this.endsOnText["value"]} ${this.endTimeText["value"]}`;
        // Clear out the fields on success
        this.startsOnText["value"] = "";
        this.endsOnText["value"] = "";
        this.startTimeText["value"] = "";
        this.endTimeText["value"] = "";
      });
  }

  ngAfterViewInit() {
    // Datepicker and timepicker scripts need to be loaded this way
    this._loadScript("bootstrap-datepicker/bootstrap-datepicker.min.js");
    this._loadStyle("bootstrap-datepicker/bootstrap-datepicker3.min.css");

    this._loadScript("bootstrap-timepicker/bootstrap-timepicker.min.js");
    this._loadStyle("bootstrap-timepicker/bootstrap-timepicker.css");

    this.initFields();
  }

  _loadScript(src: string) {
    const s = document.createElement("script");
    s.type = "text/javascript";
    s.src = "node_modules/dv-organization-event/lib/components/" +
      "edit-event-time/vendor/" + src;
    this._elementRef.nativeElement.appendChild(s);
  }

  _loadStyle(href: string) {
    const s = document.createElement("link");
    s.type = "text/css";
    s.rel = "stylesheet";
    s.href = "node_modules/dv-organization-event/lib/components/" +
      "edit-event-time/vendor/" + href;
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

  private initFields() {
    if (this.event.atom_id) {
      console.log(`starts-on-text-${this.event.atom_id}`);
      this.startsOnText =
        document.getElementById(`starts-on-text-${this.event.atom_id}`);
      console.log(this.startsOnText);
      this.endsOnText =
        document.getElementById(`ends-on-text-${this.event.atom_id}`);
      this.startTimeText =
        document.getElementById(`start-time-text-${this.event.atom_id}`);
      this.endTimeText =
        document.getElementById(`end-time-text-${this.event.atom_id}`);
    }
  }
}
