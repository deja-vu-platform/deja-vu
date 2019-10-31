import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input,
  OnChanges, OnDestroy, OnInit, Output
} from '@angular/core';
import { DvService, DvServiceFactory, OnEval } from '@deja-vu/core';

import {
  CalendarDateFormatter, CalendarEvent, CalendarEventTitleFormatter
} from 'angular-calendar';

import {
  CustomDateFormatterProvider, CustomEventTitleFormatterProvider
} from '../shared/schedule.provider';
import { slotsToCalendarEvents } from '../shared/schedule.utils';

import { API_PATH } from '../schedule.config';
import { Schedule } from '../shared/schedule.model';

import * as _ from 'lodash';

interface ShowScheduleRes {
  data: { schedule: Schedule };
}


@Component({
  selector: 'schedule-show-schedule',
  templateUrl: './show-schedule.component.html',
  styleUrls: ['./show-schedule.component.css'],
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
export class ShowScheduleComponent
  implements AfterViewInit, OnChanges, OnDestroy, OnEval, OnInit {
  @Input() waitOn: string[];
  // Provide one of the following: id or schedule
  @Input() id: string | undefined;

  get schedule() { return this._schedule; }
  scheduleWasGiven = false;
  @Input() set schedule(value: Schedule | undefined) {
    if (!_.isNil(value)) {
      this.scheduleWasGiven = true;
      this.events = slotsToCalendarEvents(value.availability, false);
      this._schedule = value;
    }
  }

  @Output() loadedSchedule = new EventEmitter();

  @Input() showId = true;
  @Input() showAvailability = true;

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

  _schedule: Schedule;
  viewDate: Date = new Date();
  events: CalendarEvent[] = [];

  private dvs: DvService;

  constructor(
    private elem: ElementRef, private dvf: DvServiceFactory,
    @Inject(API_PATH) private apiPath) { }

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .withDefaultWaiter()
      .withRefreshCallback(() => { this.load(); })
      .build();
  }

  ngAfterViewInit() {
    this.load();
  }

  ngOnChanges(changes) {
    if (this.dvs && this.dvs.waiter.processChanges(changes)) {
      this.load();
    }
  }

  load() {
    if (this.canEval()) {
      this.dvs.eval();
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      const res = await this.dvs.waitAndGet<ShowScheduleRes>(
        this.apiPath, () => ({
          params: {
            inputs: {
              id: this.id
            },
            extraInfo: {
              returnFields: `
                ${this.showId ? 'id' : ''}
                ${this.showAvailability ? 'availability { startDate, endDate }'
                  : ''}
              `
            }
          }
        }));
      const schedule =  res.data.schedule;
      this.events = slotsToCalendarEvents(schedule.availability, false);
      this._schedule = schedule;

      this.loadedSchedule.emit(schedule);
    } else if (this.dvs) {
      this.dvs.noRequest();
    }
  }

  ngOnDestroy(): void {
    this.dvs.onDestroy();
  }

  private canEval(): boolean {
    return !!(this.dvs && !this.scheduleWasGiven);
  }
}
