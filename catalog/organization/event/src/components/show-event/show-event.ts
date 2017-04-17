import {Widget} from "client-bus";


@Widget({
  fqelement: "Event",
  template: `{{event.start_date}} - {{event.end_date}}`
})
export class ShowEventComponent {
  event = {start_date: "", end_date: ""};

  dvAfterInit() {
    this.event.start_date = this.formatDateStr(this.event.start_date);
    this.event.end_date = this.formatDateStr(this.event.end_date);
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
