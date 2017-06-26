import {ElementRef} from "@angular/core";

import {Observable} from "rxjs/Observable";
import "rxjs/add/operator/map";
import "rxjs/add/observable/from";
import "rxjs/add/operator/mergeMap";

import {GraphQlService} from "gql";

import {Widget, ClientBus, field} from "client-bus";

import * as _u from "underscore";


export interface WeeklyEvent {
  atom_id: string;
  starts_on: Date;
  ends_on: Date;
}

export interface Event {
  start_date: Date;
  end_date: Date;
}

export interface EventItem {
  event: Event;
}

@Widget({
  fqelement: "Event",
  ng2_providers: [GraphQlService],
  external_styles: [
    `https://cdnjs.cloudflare.com/ajax/libs/bootstrap-select/1.12.1/css/` +
    `bootstrap-select.min.css`
  ]
})
export class ChooseAndShowWeeklyEventComponent {
  weekly_events: WeeklyEvent[] = [];
  events: EventItem[] = [];
  selected_weekly_event: WeeklyEvent = {
    atom_id: undefined, starts_on: undefined, ends_on: undefined
  };

  constructor(
      private _graphQlService: GraphQlService,
      private _elementRef: ElementRef,
      private _clientBus: ClientBus) {
    _clientBus.init(this, [field("selected_weekly_event", "WeeklyEvent")]);
  }

  dvAfterInit() {
    this._graphQlService
      .get(`
        weeklyevent_all {
          atom_id,
          starts_on,
          ends_on
        }
      `)
      .map(data => data.weeklyevent_all)
      .flatMap((weekly_events: WeeklyEvent[], unused_ix) => Observable
          .from(weekly_events))
      .map(weekly_event => _u
          .extendOwn(this._clientBus.new_atom("WeeklyEvent"), weekly_event))
      .subscribe(weekly_event => this.weekly_events.push(weekly_event));
  }

  updateEvents(atom_id) {
    this.selected_weekly_event = _u
      .findWhere(this.weekly_events, {atom_id: atom_id}); // tmp hack
    this.events = [];
    this._graphQlService
      .get(`
        weeklyevent_by_id(atom_id: "${atom_id}") {
          events {
            atom_id,
            start_date,
            end_date
          }
        }
      `)
      .map(data => data.weeklyevent_by_id.events)
      .flatMap((events: Event[], unused_ix) => Observable
        .from(events.sort((e1, e2) => {
          return new Date(e1.start_date).getTime() -
                 new Date(e2.start_date).getTime();
        })))
      .map(e => _u.extendOwn(this._clientBus.new_atom("Event"), e))
      .subscribe(e => this.events.push(e));
  }

  ngAfterViewInit() {
    const s = document.createElement("script");
    s.type = "text/javascript";
    s.src = `https://cdnjs.cloudflare.com/ajax/libs/bootstrap-select/` +
      `1.12.1/js/bootstrap-select.min.js`;
    this._elementRef.nativeElement.appendChild(s);
  }
}
