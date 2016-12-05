import {ElementRef} from "angular2/core";
import {HTTP_PROVIDERS} from "angular2/http";

import {GraphQlService} from "gql";

import {Widget} from "client-bus";


interface WeeklyEvent {
  atom_id: string;
  starts_on: Date;
  ends_on: Date;
}

interface Event {
  start_date: Date;
  end_date: Date;
}

@Widget({
  ng2_providers: [GraphQlService, HTTP_PROVIDERS],
  external_styles: [
    `https://cdnjs.cloudflare.com/ajax/libs/bootstrap-select/1.12.1/css/` +
    `bootstrap-select.min.css`
  ]
})
export class WeeklyEventComponent {
  weekly_events: WeeklyEvent[];
  events: Event[];

  constructor(
      private _graphQlService: GraphQlService,
      private _elementRef: ElementRef) {}

  ngOnInit() {
    this._graphQlService
      .get(`
        weeklyevent_all {
          atom_id,
          starts_on,
          ends_on
        }
      `)
      .map(data => data.weeklyevent_all)
      .subscribe(weeklyevents => {
        console.log(weeklyevents);
        this.weekly_events = weeklyevents;
      });
  }

  updateEvents(atom_id) {
    console.log(atom_id);
    this._graphQlService
      .get(`
        weeklyevent_by_id(atom_id: "${atom_id}") {
          events {
            start_date,
            end_date
          }
        }
      `)
      .map(data => data.weeklyevent_by_id.events)
      .subscribe(events => this.events = events);
  }

  ngAfterViewInit() {
    const s = document.createElement("script");
    s.type = "text/javascript";
    s.src = `https://cdnjs.cloudflare.com/ajax/libs/bootstrap-select/` +
      `1.12.1/js/bootstrap-select.min.js`;
    this._elementRef.nativeElement.appendChild(s);
  }
}
