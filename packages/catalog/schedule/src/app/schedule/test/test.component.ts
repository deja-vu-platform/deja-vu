
import { Component } from '@angular/core';
import { Subject } from 'rxjs/Subject';

import {
  CalendarDateFormatter, CalendarEvent, CalendarEventTimesChangedEvent,
  CalendarEventTitleFormatter, DateFormatterParams
} from 'angular-calendar';
import {
  addDays,
  addHours,
  endOfDay,
  endOfMonth,
  getISOWeek,
  isSameDay,
  isSameMonth,
  startOfDay,
  subDays
} from 'date-fns';

import { DatePipe } from '@angular/common';

export class CustomDateFormatterProvider extends CalendarDateFormatter {

  public dayViewHour({ date, locale }: DateFormatterParams): string {
    return new DatePipe(locale).transform(date, 'HH:mm', locale);
  }

  public weekViewTitle({ date, locale }: DateFormatterParams): string {
    const year: string = new DatePipe(locale).transform(date, 'y', locale);
    const weekNumber: number = getISOWeek(date);

    return `Week ${weekNumber} in ${year}`;
  }

  public weekViewColumnHeader({ date, locale }: DateFormatterParams): string {
    return new DatePipe(locale).transform(date, 'E', locale);
  }

  public weekViewColumnSubHeader(
    { date, locale }: DateFormatterParams): string {
    return new DatePipe(locale).transform(date, 'MM/dd', locale);
  }

}

export class CustomEventTitleFormatterProvider extends
  CalendarEventTitleFormatter {

  dayTooltip(event: CalendarEvent): string {
    return;
  }
}

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
  viewDate: Date = new Date();
  view = 'week';
  locale = 'en';
  isDragging = false;
  refresh: Subject<any> = new Subject();

  events: CalendarEvent[] = [
    // {
    //   start: addHours(startOfDay(new Date()), 7),
    //   end: addHours(startOfDay(new Date()), 9),
    //   title: 'First Event',
    //   cssClass: 'custom-event',
    //   color: {
    //     primary: '#488aff',
    //     secondary: '#bbd0f5'
    //   },
    //   resizable: {
    //     beforeStart: true,
    //     afterEnd: true
    //   },
    //   draggable: true
    // },
    // {
    //   start: addHours(startOfDay(new Date()), 10),
    //   end: addHours(startOfDay(new Date()), 12),
    //   title: 'Second Event',
    //   cssClass: 'custom-event',
    //   color: {
    //     primary: '#488aff',
    //     secondary: '#bbd0f5'
    //   },
    //   resizable: {
    //     beforeStart: true,
    //     afterEnd: true
    //   },
    //   draggable: true
    // }
  ];

  handleEvent(event: CalendarEvent): void {
    alert(event.title + ' ' + event.start + ' to ' + event.end);
  }

  eventTimesChanged(
    { event, newStart, newEnd }: CalendarEventTimesChangedEvent): void {
    if (this.isDragging) {
      return;
    }
    this.isDragging = true;

    event.start = newStart;
    event.end = newEnd;
    this.refresh.next();

    setTimeout(() => {
      this.isDragging = false;
    }, 1000);
  }

  hourSegmentClicked(event): void {
    console.log(JSON.stringify(event))
    const newEvent: CalendarEvent = {
      start: event.date,
      end: addHours(event.date, 1),
      title: 'TEST EVENT',
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
