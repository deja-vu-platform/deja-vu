import {Component, Input, ElementRef, OnInit} from "@angular/core";

import {Observable} from "rxjs/Observable";
import "rxjs/add/operator/map";
import "rxjs/add/observable/from";
import "rxjs/add/operator/mergeMap";

import {GraphQlService} from "gql";


import {WeeklyEvent, Event} from "../../shared/data";

import * as _u from "underscore";


export type EventItem = { event: Event; };


@Component({
  selector: "choose-and-show-weekly-event",
  providers: [GraphQlService],
  templateUrl: "./choose-and-show-weekly-event.html",
  styleUrls: [
    `https://cdnjs.cloudflare.com/ajax/libs/bootstrap-select/1.12.1/css/` +
    `bootstrap-select.min.css`
  ]
})
export class ChooseAndShowWeeklyEventComponent implements OnInit {
  @Input() selected_weekly_event: WeeklyEvent;
  weekly_events: WeeklyEvent[] = [];
  events: EventItem[] = [];

  constructor(
      private _graphQlService: GraphQlService,
      private _elementRef: ElementRef) {}

  ngOnInit() {
    this._graphQlService
      .get<any>(`
        weeklyevent_all {
          atom_id,
          starts_on,
          ends_on
        }
      `)
      .map(data => data.weeklyevent_all)
      .flatMap((weekly_events: WeeklyEvent[], unused_ix) => Observable
          .from(weekly_events))
      .subscribe(weekly_event => this.weekly_events.push(weekly_event));
  }

  updateEvents(atom_id) {
    this.selected_weekly_event = _u
      .findWhere(this.weekly_events, {atom_id: atom_id}); // tmp hack
    this.events = [];
    this._graphQlService
      .get<any>(`
        weeklyevent_by_id(atom_id: "${atom_id}") {
          events {
            atom_id,
            start_date,
            end_date,
            weekly_event_id
          }
        }
      `)
      .map(data => data.weeklyevent_by_id.events)
      .flatMap((events: Event[], unused_ix) => Observable
        .from(events.sort((e1, e2) => {
          return new Date(e1.start_date).getTime() -
                 new Date(e2.start_date).getTime();
        })))
      .subscribe(e => this.events.push({event: e}));
  }

  ngAfterViewInit() {
    const s = document.createElement("script");
    s.type = "text/javascript";
    s.src = `https://cdnjs.cloudflare.com/ajax/libs/bootstrap-select/` +
      `1.12.1/js/bootstrap-select.min.js`;
    this._elementRef.nativeElement.appendChild(s);
  }
}
