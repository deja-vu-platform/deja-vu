import { Component, Input } from '@angular/core';
import { Subject } from 'rxjs/Subject';

import {
  CalendarDateFormatter, CalendarEvent, CalendarEventTimesChangedEvent,
  CalendarEventTitleFormatter
} from 'angular-calendar';
import { addHours, endOfDay, startOfDay } from 'date-fns';

import { MonthViewDay } from 'calendar-utils';
import {
  CustomDateFormatterProvider, CustomEventTitleFormatterProvider
} from '../shared/schedule.provider';
import { timeRange } from '../shared/schedule.utils';

import * as _ from 'lodash';

@Component({
  selector: 'schedule-test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.css'],
  providers: [
    {
      provide: CalendarDateFormatter,
      useClass: CustomDateFormatterProvider
    },
    {
      provide: CalendarEventTitleFormatter,
      useClass: CustomEventTitleFormatterProvider
    }
  ]
})
export class TestComponent {
  @Input() view: 'day' | 'week' | 'month' = 'week';
  @Input() locale = 'en';
  // The number of 60/num minute segments in an hour. Must be <= 6
  @Input() hourSegments = 2;
  // The day start hours in 24 hour time. Must be 0-23
  @Input() dayStartHour = 9;
  // The day end hours in 24 hour time. Must be 0-23
  @Input() dayEndHour = 17;
  // The default length of a newly added event (in hours)
  @Input() eventLength = 1;

  viewDate: Date = new Date();
  isDragging = false;
  refresh: Subject<any> = new Subject();

  events: CalendarEvent[] = [
    {
      start: addHours(startOfDay(new Date()), 7),
      end: addHours(startOfDay(new Date()), 9),
      title: 'First Event',
      cssClass: 'custom-event',
      color: {
        primary: '#488aff',
        secondary: '#bbd0f5'
      },
      resizable: {
        beforeStart: true,
        afterEnd: true
      },
      draggable: true
    },
    {
      start: addHours(startOfDay(new Date()), 10),
      end: addHours(startOfDay(new Date()), 12),
      title: 'Second Event',
      cssClass: 'custom-event',
      color: {
        primary: '#488aff',
        secondary: '#bbd0f5'
      },
      resizable: {
        beforeStart: true,
        afterEnd: true
      },
      draggable: true
    }
  ];

  handleEvent(event: CalendarEvent): void {
    console.log('an event', event)
    if (confirm(`Do you want to delete the following slot:
    ${timeRange(event.start, event.end)}?`)) {
      _.pull(this.events, event);
      this.refresh.next();
    }
    // alert(event.title + ' ' + event.start + ' to ' + event.end);
  }

  // Sad note: Cannot drag event to another week
  eventTimesChanged(
    { event, newStart, newEnd }: CalendarEventTimesChangedEvent): void {
    if (this.isDragging) {
      return;
    }
    this.isDragging = true;

    event.start = newStart;
    event.end = newEnd;
    event.title = timeRange(newStart, newEnd);
    this.refresh.next();

    setTimeout(() => {
      this.isDragging = false;
    }, 1000);
  }

  hourSegmentClicked(event): void {
    console.log(JSON.stringify(event));
    const newEvent: CalendarEvent = {
      start: event.date,
      end: addHours(event.date, this.eventLength),
      title: timeRange(event.date, addHours(event.date, this.eventLength)),
      cssClass: 'custom-event',
      color: {
        primary: '#488aff',
        secondary: '#bbd0f5'
      },
      resizable: {
        beforeStart: true,
        afterEnd: true
      },
      draggable: true
    };

    this.events.push(newEvent);
    this.refresh.next();
  }

  dayClicked(event: { day: MonthViewDay }): void {
    console.log('day', JSON.stringify(event));
    const newEvent: CalendarEvent = {
      start: startOfDay(event.day.date),
      end: endOfDay(event.day.date),
      title: timeRange(startOfDay(event.day.date), endOfDay(event.day.date)),
      cssClass: 'custom-event',
      color: {
        primary: '#488aff',
        secondary: '#bbd0f5'
      },
      resizable: {
        beforeStart: true,
        afterEnd: true
      },
      draggable: true
    };

    this.events.push(newEvent);
    this.refresh.next();
  }
}
