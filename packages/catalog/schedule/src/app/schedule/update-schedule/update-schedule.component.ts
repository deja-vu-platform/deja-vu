import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnChanges,
  OnInit, SimpleChanges, Type
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
import { filter, take } from 'rxjs/operators';

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
  // A list of fields to wait for
  @Input() waitOn: string[] = [];
  // Watcher of changes to fields specified in `waitOn`
  // Emits the field name that changes
  fieldChange = new EventEmitter<string>();
  activeWaits = new Set<string>();
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
    private rs: RunService, @Inject(API_PATH) private apiPath) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  ngAfterViewInit() {
    this.load();
  }

  ngOnChanges(changes: SimpleChanges) {
    for (const field of this.waitOn) {
      if (changes[field] && !_.isNil(changes[field].currentValue)) {
        this.fieldChange.emit(field);
      }
    }
    // We should only reload iif what changed is something we are not
    // waiting on (because if ow we would send a double request)
    let shouldLoad = false;
    for (const fieldThatChanged of _.keys(changes)) {
      if (!this.activeWaits.has(fieldThatChanged)) {
        shouldLoad = true;
      }
    }
    if (shouldLoad) {
      this.load();
    }
  }

  load() {
    if (this.canEval()) {
      this.rs.eval(this.elem);
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      if (!_.isEmpty(this.waitOn)) {
        await Promise.all(_.chain(this.waitOn)
          .filter((field) => _.isNil(this[field]))
          .tap((fs) => {
            this.activeWaits = new Set(fs);

            return fs;
          })
          .map((fieldToWaitFor) => this.fieldChange
            .pipe(filter((field) => field === fieldToWaitFor), take(1))
            .toPromise())
          .value());
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
            this.events = slotsToCalendarEvents(
              this.schedule.availability, true);
          }
        });
    }
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

  private canEval(): boolean {
    return !!(this.gs && this.id);
  }
}
