import {Widget} from "client-bus";
import {GraphQlService} from "gql";

@Widget({
  fqelement: "Event",
  ng2_providers: [GraphQlService],
  template: `{{event.start_date}} - {{event.end_date}}`
})
export class ShowEventComponent {
  event = {start_date: "", end_date: "", atom_id: undefined};

  constructor(private _graphQlService: GraphQlService) {}

  dvAfterInit() {
    if (this.event.start_date && this.event.end_date) {
      this.event.start_date = this.formatDateStr(this.event.start_date);
      this.event.end_date = this.formatDateStr(this.event.end_date);
    } else if (this.event.atom_id) {
      this._graphQlService
        .get(`
          event_by_id(atom_id: "${this.event.atom_id}") {
            start_date,
            end_date
          }
        `)
        .subscribe(obj => {
          const start_date = obj.event_by_id.start_date;
          const end_date = obj.event_by_id.end_date;
          this.event.start_date = this.formatDateStr(start_date);
          this.event.end_date = this.formatDateStr(end_date);
        });
    }
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
