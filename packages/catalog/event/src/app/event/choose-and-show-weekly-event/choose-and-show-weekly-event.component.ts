import { Component, OnInit, ElementRef, Input, Type } from '@angular/core';
import { DatePipe } from '@angular/common';
import { GatewayServiceFactory, GatewayService, Action } from 'dv-core';
import * as _ from 'lodash';

import { Observable } from 'rxjs/Observable';
import { map } from 'rxjs/operators';

import { WeeklyEvent, Event } from '../../../../shared/data';

import { ShowEventComponent } from '../show-event/show-event.component';


@Component({
  selector: 'event-choose-and-show-weekly-event',
  templateUrl: './choose-and-show-weekly-event.component.html',
  styleUrls: ['./choose-and-show-weekly-event.component.css'],
  providers: [ DatePipe ]
})
export class ChooseAndShowWeeklyEventComponent implements OnInit {
  @Input() noEventsToShowText = 'No events to show';
  @Input() chooseWeeklyEventSelectPlaceholder = 'Choose Weekly Event';
  selectedWeeklyEvent: WeeklyEvent;
  weeklyEvents: WeeklyEvent[] = [];
  events: Event[] = [];
  gs: GatewayService;

  @Input() showEvent: Action = {type: <Type<Component>> ShowEventComponent};

  chooseAndShowWeeklyEvent;

  constructor(private elem: ElementRef, private gsf: GatewayServiceFactory) {
    this.chooseAndShowWeeklyEvent = this;
  }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.gs
      .get<{data: {weeklyEvents: WeeklyEvent[]}}>('/graphql', {
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
      .pipe(map(res => res.data.weeklyEvents))
      .subscribe((weeklyEvents: WeeklyEvent[]) => {
        this.weeklyEvents = weeklyEvents;
      });
  }

  updateEvents(id: string) {
     // tmp hack
    this.selectedWeeklyEvent = _.find(this.weeklyEvents, {id: id});
    this.events = [];
    this.gs
      .get<{data: {weeklyEvent: {events: Event[]}}}>('/graphql/', {
        params: {
          query: `
            query {
              weeklyEvent(id: "${id}") {
                events {
                  id,
                  startDate,
                  endDate,
                  weeklyEvent {
                    id
                  }
                }
              }
            }
          `
        }
      })
      .pipe(map(res => res.data.weeklyEvent.events))
      .subscribe((events: Event[]) => {
        events.sort((e1, e2) => {
            return new Date(e1.startDate).getTime() -
                   new Date(e2.startDate).getTime();
        });
        this.events = _.map(events, evt => {
          evt.weeklyEventId = evt.weeklyEvent.id;
          return evt;
        });
      });
  }
}
