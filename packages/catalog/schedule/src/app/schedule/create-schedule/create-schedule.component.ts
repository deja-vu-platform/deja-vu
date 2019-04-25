import {
  Component, ElementRef, Inject, Input, OnInit
} from '@angular/core';

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
import {
  calendarEventsToSlots, createNewCalendarEvent, timeRange
} from '../shared/schedule.util';

import {
  GatewayService, GatewayServiceFactory, OnExec, OnExecFailure, OnExecSuccess,
  RunService
} from '@deja-vu/core';

import * as _ from 'lodash';

import { API_PATH } from '../schedule.config';
import { Schedule, Slot } from '../shared/schedule.model';

const SAVED_MSG_TIMEOUT = 3000;
const DRAG_TIMEOUT = 1000;

interface CreateScheduleRes {
  data: { createSchedule: Schedule };
  errors: { message: string }[];
}

@Component({
  selector: 'schedule-create-schedule',
  templateUrl: './create-schedule.component.html',
  styleUrls: ['./create-schedule.component.css'],
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
export class CreateScheduleComponent implements OnInit, OnExec, OnExecFailure,
  OnExecSuccess {
  @Input() id: string | undefined;
  @Input() showOptionToSubmit = true;

  // Presentation inputs
  @Input() buttonLabel = 'Create Schedule';
  @Input() newScheduleSavedText = 'New schedule saved';
  @Input() removeSlotText = 'Do you want to remove the following slot:';

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

  newScheduleSaved = false;
  newScheduleError: string;

  events: CalendarEvent[] = [];

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, @Inject(API_PATH) private apiPath) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  handleEvent(event: CalendarEvent): void {
    if (confirm(`${this.removeSlotText}
    ${timeRange(event.start, event.end)}?`)) {
      _.pull(this.events, event);
      this.refresh.next();
    }
  }

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
    }, DRAG_TIMEOUT);
  }

  hourSegmentClicked(event: { date: Date }): void {
    const start: Date = event.date;
    const end: Date = addHours(event.date, this.eventLength);
    const newEvent: CalendarEvent = createNewCalendarEvent(start, end, true);

    this.events.push(newEvent);
    this.refresh.next();
  }

  dayClicked(event: { day: MonthViewDay }): void {
    const start: Date = startOfDay(event.day.date);
    const end: Date = endOfDay(event.day.date);
    const newEvent: CalendarEvent = createNewCalendarEvent(start, end, true);

    this.events.push(newEvent);
    this.refresh.next();
  }

  onSubmit() {
    this.rs.exec(this.elem);
  }

  async dvOnExec(): Promise<void> {
    const res = await this.gs.post<CreateScheduleRes>(this.apiPath, {
      inputs: {
        input: {
          id: this.id,
          slots: calendarEventsToSlots(this.events)
        }
      },
      extraInfo: {
        returnFields: 'id, availability { id, startDate, endDate }'
      }
    })
      .toPromise();

    if (res.errors) {
      throw new Error(_.map(res.errors, 'message')
        .join());
    }
  }

  dvOnExecSuccess() {
    this.newScheduleSaved = true;
    window.setTimeout(() => {
      this.newScheduleSaved = false;
    }, SAVED_MSG_TIMEOUT);
    this.events = [];
  }

  dvOnExecFailure(reason: Error) {
    this.newScheduleError = reason.message;
  }
}
