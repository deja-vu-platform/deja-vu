import {
  AfterViewInit, ChangeDetectorRef, Component, ElementRef, Inject, Input,
  OnChanges, OnInit
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
  calendarEventsToSlots, createNewCalendarEvent,
  dateTimeRange, slotsToCalendarEvents, timeRange
} from '../shared/schedule.utils';

import {
  GatewayService, GatewayServiceFactory, OnExec, OnExecFailure, OnExecSuccess,
  RunService
} from '@deja-vu/core';

import * as _ from 'lodash';

import { API_PATH } from '../schedule.config';
import { Schedule } from '../shared/schedule.model';

const SAVED_MSG_TIMEOUT = 3000;
const DRAG_TIMEOUT = 1000;

interface ScheduleRes {
  data: { schedule: Schedule };
  errors: { message: string }[];
}

interface UpdateScheduleRes {
  data: { updateSchedule: boolean };
  errors: { message: string }[];
}

@Component({
  selector: 'schedule-update-schedule',
  templateUrl: './update-schedule.component.html',
  styleUrls: ['./update-schedule.component.css'],
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
export class UpdateScheduleComponent implements AfterViewInit,
  OnInit, OnExec, OnExecFailure, OnExecSuccess, OnChanges {
  @Input() id: string;
  @Input() showOptionToSubmit = true;

  // Presentation inputs
  @Input() buttonLabel = 'Update Schedule';
  @Input() updateScheduleSavedText = 'Schedule updated';
  @Input() deleteSlotText = 'Do you want to delete the following slot:';
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

  updateScheduleSaved = false;
  updateScheduleError: string;

  schedule: Schedule;
  events: CalendarEvent[] = [];
  newEvents: CalendarEvent[] = [];
  deletedEventIds: string[] = [];

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, private cd: ChangeDetectorRef,
    @Inject(API_PATH) private apiPath) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
    this.loadSchedule();
  }

  ngOnChanges() {
    this.loadSchedule();
  }

  ngAfterViewInit() {
    this.cd.detectChanges();
  }

  loadSchedule() {
    if (!this.gs || !this.id) {
      return;
    }

    this.gs.get<ScheduleRes>(this.apiPath, {
      params: {
        inputs: { id: this.id },
        extraInfo: {
          action: 'load',
          returnFields: 'id, availability { id, startDate, endDate }'
        }
      }
    })
      .subscribe((res) => {
        if (!_.isNil(res.data.schedule)) {
          this.schedule = res.data.schedule;
          this.events = slotsToCalendarEvents(this.schedule.availability, true);
        }
      });
  }

  handleEvent(event: CalendarEvent): void {
    if (confirm(`${this.deleteSlotText}
    ${dateTimeRange(event.start, event.end)}?`)) {
      _.pull(this.events, event);
      this.deletedEventIds.push(event.id.toString());
      this.refresh.next();
    }
  }

  eventTimesChanged(
    { event, newStart, newEnd }: CalendarEventTimesChangedEvent): void {
    if (this.isDragging) {
      return;
    }
    this.isDragging = true;

    this.deletedEventIds.push(event.id.toString());
    _.remove(this.newEvents, (e) => e.id === event.id);

    event.start = newStart;
    event.end = newEnd;
    event.title = timeRange(newStart, newEnd);

    this.newEvents.push(event);

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
    this.newEvents.push(newEvent);
    this.refresh.next();
  }

  dayClicked(event: { day: MonthViewDay }): void {
    const start: Date = startOfDay(event.day.date);
    const end: Date = endOfDay(event.day.date);
    const newEvent: CalendarEvent = createNewCalendarEvent(start, end, true);

    this.events.push(newEvent);
    this.newEvents.push(newEvent);
    this.refresh.next();
  }

  onSubmit() {
    this.rs.exec(this.elem);
  }

  async dvOnExec(): Promise<boolean> {
    const res = await this.gs.post<UpdateScheduleRes>(this.apiPath, {
      inputs: {
        input: {
          id: this.id,
          add: calendarEventsToSlots(this.newEvents),
          delete: _.uniq(this.deletedEventIds)
        }
      },
      extraInfo: {
        action: 'update'
      }
    })
      .toPromise();

    if (res.errors) {
      throw new Error(_.map(res.errors, 'message')
        .join());
    }

    return res.data.updateSchedule;
  }

  dvOnExecSuccess() {
    this.updateScheduleSaved = true;
    this.updateScheduleError = '';
    window.setTimeout(() => {
      this.updateScheduleSaved = false;
    }, SAVED_MSG_TIMEOUT);
  }

  dvOnExecFailure(reason: Error) {
    this.updateScheduleError = reason.message;
  }
}
