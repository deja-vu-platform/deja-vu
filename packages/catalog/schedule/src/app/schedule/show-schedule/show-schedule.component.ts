import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnChanges,
  OnInit, Output
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnEval, RunService
} from '@deja-vu/core';
import { map } from 'rxjs/operators';

import { Subject } from 'rxjs/Subject';

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
export class ShowScheduleComponent implements AfterViewInit, OnChanges, OnEval,
  OnInit {
  // Provide one of the following: id or schedule
  @Input() id: string | undefined;

  get schedule() { return this._schedule; }
  @Input() set schedule(value: Schedule | undefined) {
    if (!_.isNil(value)) {
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
  refresh: Subject<any> = new Subject();
  events: CalendarEvent[] = [];

  private gs: GatewayService;

  constructor(
    private elem: ElementRef,
    private gsf: GatewayServiceFactory,
    private rs: RunService,
    @Inject(API_PATH) private apiPath) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  ngAfterViewInit() {
    this.load();
  }

  ngOnChanges() {
    this.load();
  }

  load() {
    if (this.canEval()) {
      this.rs.eval(this.elem);
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      this.gs.get<ShowScheduleRes>(this.apiPath, {
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
      })
        .pipe(map((res: ShowScheduleRes) => res.data.schedule))
        .subscribe((schedule) => {
          this.schedule = schedule;
          this.loadedSchedule.emit(schedule);
        });
    }
  }

  private canEval(): boolean {
    return !!(!this.schedule && this.id && this.gs);
  }
}
