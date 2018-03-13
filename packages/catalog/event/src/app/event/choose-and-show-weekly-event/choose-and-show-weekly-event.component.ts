import { DatePipe } from '@angular/common';
import { Component, ElementRef, Input, OnInit, Type } from '@angular/core';
import { Action, GatewayService, GatewayServiceFactory } from 'dv-core';
import * as _ from 'lodash';

import { Observable } from 'rxjs/Observable';
import { map } from 'rxjs/operators';

import { Event, WeeklyEvent } from '../../../../shared/data';

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

  @Input() showEvent: Action = {type: <Type<Component>> ShowEventComponent};

  chooseAndShowWeeklyEvent;
  private gs: GatewayService;

  constructor(private elem: ElementRef, private gsf: GatewayServiceFactory) {
    this.chooseAndShowWeeklyEvent = this;
  }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
  }

  // TODO: should instead make this reactive with Apollo
  maybeFetchEvents(toggle: boolean) {
    if (toggle) {
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
        .pipe(map((res) => res.data.weeklyEvents))
        .subscribe((weeklyEvents: WeeklyEvent[]) => {
          this.weeklyEvents = weeklyEvents;
        });
    }
  }

  updateEvents(selectedWeeklyEvent: WeeklyEvent) {
    this.selectedWeeklyEvent = selectedWeeklyEvent;
    this.events = [];
    if (!selectedWeeklyEvent) {
      return;
    }
    this.gs
      .get<{data: {weeklyEvent: {events: Event[]}}}>('/graphql', {
        params: {
          query: `
            query {
              weeklyEvent(id: "${selectedWeeklyEvent.id}") {
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
      .pipe(map((res) => res.data.weeklyEvent.events))
      .subscribe((events: Event[]) => {
        this.events = _.map(events, (evt) => {
          evt.weeklyEventId = evt.weeklyEvent.id;

          return evt;
        });
      });
  }
}
