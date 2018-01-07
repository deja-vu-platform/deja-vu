import {Component, Input} from "@angular/core";
import {Event} from "../../shared/data";
import {GraphQlService} from "gql";


@Component({
  selector: "show-event",
  providers: [GraphQlService],
  template: `{{event.start_date}} - {{event.end_date}}`
})
export class ShowEventComponent {
  _event = {start_date: "", end_date: ""};

  constructor(private _graphQlService: GraphQlService) {}

  @Input()
  set event(e: Event) {
    if (e.start_date && e.end_date) {
      this._event.start_date = this.formatDateStr(e.start_date);
      this._event.end_date = this.formatDateStr(e.end_date);
    } else if (e.atom_id) {
      this._graphQlService
        .get(`
          event_by_id(atom_id: "${e.atom_id}") {
            start_date,
            end_date
          }
        `)
        .subscribe((obj: any) => {
          const start_date = obj.event_by_id.start_date;
          const end_date = obj.event_by_id.end_date;
          this._event.start_date = this.formatDateStr(start_date);
          this._event.end_date = this.formatDateStr(end_date);
        });
    }
  }

  get event(): Event { return this._event; }

  private formatDateStr(date: string): string {
    const opts = {
      day: "numeric", weekday: "short", month: "short", year: "numeric",
      hour: "numeric", minute: "numeric"
    };
    const d = new Date(date);
    return d.toLocaleDateString("en-US", opts);
  }
}
