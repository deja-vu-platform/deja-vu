import { Component, OnInit, ElementRef } from '@angular/core';
import { GatewayServiceFactory, GatewayService } from 'dv-core';
import * as _ from 'lodash';

import { Observable } from 'rxjs/Observable';
import { from } from 'rxjs/observable/from';
import { map, flatMap } from 'rxjs/operators';

import { WeeklyEvent, Event } from '../../../../shared/data';


@Component({
  selector: 'event-choose-and-show-weekly-event',
  templateUrl: './choose-and-show-weekly-event.component.html',
  styleUrls: ['./choose-and-show-weekly-event.component.css']
})
export class ChooseAndShowWeeklyEventComponent implements OnInit {
  selectedWeeklyEvent: WeeklyEvent;
  weeklyEvents: WeeklyEvent[] = [];
  events: Event[] = [];
  gs: GatewayService;

  constructor(
    private elem: ElementRef, gsf: GatewayServiceFactory) {
    this.gs = gsf.for(elem);
  }

  ngOnInit() {
    this.gs
      .get<{weeklyEvents: WeeklyEvent[]}>('/graphql', {
        params: {
          query: `
            query {
              weeklyEvents {
                id,
                startsOn,
                  endsOn
              }
            }
          `
        }
      })
      .pipe(
        map(data => data.weeklyEvents),
        flatMap((weeklyEvents: WeeklyEvent[], {}) => from(weeklyEvents)),
      )
      .subscribe(weeklyEvent => this.weeklyEvents.push(weeklyEvent));
  }

  updateEvents(id) {
     // tmp hack
    this.selectedWeeklyEvent = _.find(this.weeklyEvents, {id: id});
    this.events = [];
    this.gs
      .get<{weeklyEvent: {events: Event[]}}>(`
        weeklyEvent(id: "${id}") {
          events {
            id,
            startDate,
            endDate,
            weeklyEventId
          }
        }
      `)
      .pipe(
        map(data => data.weeklyEvent.events),
        flatMap((events: Event[], {}) => from(events.sort((e1, e2) => {
            return new Date(e1.startDate).getTime() -
                   new Date(e2.startDate).getTime();
          })))
      )
      .subscribe(e => this.events.push(e));
  }
}
