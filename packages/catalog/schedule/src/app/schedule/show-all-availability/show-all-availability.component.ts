import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnChanges,
  OnInit, Output, Type
} from '@angular/core';
import {
  Action, GatewayService, GatewayServiceFactory, OnEval, RunService
} from '@deja-vu/core';
import { map } from 'rxjs/operators';

import { API_PATH } from '../schedule.config';
import { Schedule, Slot } from '../shared/schedule.model';

import {
  ShowScheduleComponent
} from '../show-schedule/show-schedule.component';
import { ShowSlotComponent } from '../show-slot/show-slot.component';
import { ShowSlotsComponent } from '../show-slots/show-slots.component';

interface AllAvailabilityRes {
  data: { allAvailability: Slot[] };
}

const MAX_NUM_SCHEDULE_IDS = 2;


@Component({
  selector: 'schedule-show-all-availability',
  templateUrl: './show-all-availability.component.html',
  styleUrls: ['./show-all-availability.component.css']
})
export class ShowAllAvailabilityComponent implements AfterViewInit, OnChanges,
  OnEval, OnInit {
  @Input() scheduleIds: string[];
  // Must be of the following format: https://en.wikipedia.org/wiki/ISO_8601
  @Input() startDate: string | undefined;
  @Input() endDate: string | undefined;

  // Choose how to sort the slots
  @Input() sortByStartDate: 'asc' | 'desc' = 'asc';
  @Input() sortByEndDate: 'asc' | 'desc' = 'asc';

  @Output() loadedAllAvailability = new EventEmitter();

  @Input() showScheduleView = true;
  @Input() showScheduleId = false;
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
  @Input() showSchedule: Action = {
    type: <Type<Component>> ShowScheduleComponent
  };

  @Input() showSlotsView = true;
  @Input() showSlotId = true;
  @Input() showStartDate = true;
  @Input() showEndDate = true;
  // See https://angular.io/api/common/DatePipe
  @Input() dateTimeFormatString = 'medium';
  @Input() showSlots: Action = {
    type: <Type<Component>> ShowSlotsComponent
  };
  @Input() showSlot: Action = {
    type: <Type<Component>> ShowSlotComponent
  };

  allAvailability: Slot[];
  schedule: Schedule;

  showAllAvailability;

  private gs: GatewayService;

  constructor(private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, @Inject(API_PATH) private apiPath) {
    this.showAllAvailability = this;
  }

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
    if (this.scheduleIds.length !== MAX_NUM_SCHEDULE_IDS) {
      throw new Error('Incorrect number of schedule IDs provided');
    }

    if (this.canEval()) {
      this.gs.get<AllAvailabilityRes>(this.apiPath, {
        params: {
          inputs: JSON.stringify({
            input: {
              scheduleIds: this.scheduleIds,
              startDate: this.startDate,
              endDate: this.endDate,
              sortByStartDate: this.sortByStartDate === 'asc' ? 1 : -1,
              sortByEndDate: this.sortByEndDate === 'asc' ? 1 : -1
            }
          }),
          extraInfo: { returnFields: 'id, startDate, endDate' }
        }
      })
        .pipe(map((res: AllAvailabilityRes) => res.data.allAvailability))
        .subscribe((allAvailability) => {
          this.allAvailability = allAvailability;
          this.schedule = {
            id: 'all-availability',
            availability: this.allAvailability
          };
          this.loadedAllAvailability.emit(allAvailability);
        });
    }
  }

  private canEval(): boolean {
    return !!(!this.allAvailability && this.scheduleIds && this.gs);
  }
}
