import {Widget, Field, AfterInit} from "client-bus";
import {EventAtom} from "../shared/data";


@Widget({
  fqelement: "Event",
  template: `{{_event.start_date}} - {{_event.end_date}}`
})
export class ShowEventComponent implements AfterInit {
  @Field("Event") event: EventAtom;

  _event = {start_date: "", end_date: ""};

  dvAfterInit() {
    this._event.start_date = this.formatDateStr(this.event.start_date);
    this._event.end_date = this.formatDateStr(this.event.end_date);
  }

  formatDateStr(date: string): string {
    const opts = {
      day: "numeric", weekday: "short", month: "short", year: "numeric",
      hour: "numeric", minute: "numeric"
    };
    const d = new Date(date);
    return d.toLocaleDateString("en-US", opts);
  }
}
