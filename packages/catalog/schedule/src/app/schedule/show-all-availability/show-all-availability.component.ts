import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnChanges,
  OnInit, Output, Type, ViewChild
} from '@angular/core';
import {
  FormBuilder, FormControl, FormGroup, FormGroupDirective
} from '@angular/forms';

import {
  ComponentValue, DvService, DvServiceFactory, OnEval
} from '@deja-vu/core';
import { map } from 'rxjs/operators';

import { API_PATH } from '../schedule.config';
import { Schedule, Slot } from '../shared/schedule.model';
import {
  endDateValidator, endTimeValidator
} from '../shared/schedule.validator';

import {
  ShowScheduleComponent
} from '../show-schedule/show-schedule.component';
import { ShowSlotComponent } from '../show-slot/show-slot.component';
import { ShowSlotsComponent } from '../show-slots/show-slots.component';

// https://github.com/dherges/ng-packagr/issues/217
import * as momentImported from 'moment'; const moment = momentImported;


interface AllAvailabilityRes {
  data: { allAvailability: Slot[] };
}


@Component({
  selector: 'schedule-show-all-availability',
  templateUrl: './show-all-availability.component.html',
  styleUrls: ['./show-all-availability.component.css']
})
export class ShowAllAvailabilityComponent
  implements AfterViewInit, OnChanges, OnEval, OnInit {
  @Input() scheduleIds: string[];
  @Input() showDateTimePicker = true;

  @Input() buttonLabel = 'Filter Slots';

  // Must be of the following format: https://en.wikipedia.org/wiki/ISO_8601
  // Example: YYYY-MM-DD
  @Input() set startDate(value: string) {
    this.startDateControl.setValue(moment(value));
  }
  @Input() set endDate(value: string) {
    this.endDateControl.setValue(moment(value));
  }

  // Must be in 24 hour format (HH:MM)
  @Input() set startTime(value: string) {
    this.startTimeControl.setValue(value);
  }
  @Input() set endTime(value: string) {
    this.endTimeControl.setValue(value);
  }

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
  @Input() showSchedule: ComponentValue = {
    type: <Type<Component>> ShowScheduleComponent
  };

  @Input() showSlotsView = true;
  @Input() showSlotId = true;
  @Input() showStartDate = true;
  @Input() showEndDate = true;
  // See https://angular.io/api/common/DatePipe
  @Input() dateTimeFormatString = 'medium';
  @Input() showSlots: ComponentValue = {
    type: <Type<Component>> ShowSlotsComponent
  };
  @Input() showSlot: ComponentValue = {
    type: <Type<Component>> ShowSlotComponent
  };

  @ViewChild(FormGroupDirective) form;

  startDateControl = new FormControl('');
  endDateControl = new FormControl('', [
    endDateValidator(() => this.startDateControl.value)
  ]);
  startTimeControl = new FormControl('');
  endTimeControl = new FormControl('', [
    endTimeValidator(() => this.startTimeControl.value)
  ]);

  dateTimeFilterForm: FormGroup = this.builder.group({
    startsOn: this.startDateControl,
    endsOn: this.endDateControl,
    startTime: this.startTimeControl,
    endTime: this.endTimeControl
  });

  allAvailability: Slot[];
  schedule: Schedule;
  showSlotsDateTimePicker = false;

  showAllAvailability;

  private dvs: DvService;

  constructor(
    private elem: ElementRef, private dvf: DvServiceFactory,
    private builder: FormBuilder, @Inject(API_PATH) private apiPath) {
    this.showAllAvailability = this;
  }

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .build();
  }

  ngAfterViewInit() {
    this.load();
  }

  ngOnChanges() {
    this.load();
  }

  load() {
    if (this.canEval()) {
      this.dvs.eval();
    }
  }

  filterSlots() {
    this.dvs.eval();
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      const startDate = this.startDateControl.value ?
        this.startDateControl.value.format('YYYY-MM-DD') : '';
      const endDate = this.endDateControl.value ?
        this.endDateControl.value.format('YYYY-MM-DD') : '';

      const res = await this.dvs.get<AllAvailabilityRes>(this.apiPath, {
        params: {
          inputs: JSON.stringify({
            input: {
              scheduleIds: this.scheduleIds,
              startDate: startDate,
              endDate: endDate,
              startTime: this.startTimeControl.value,
              endTime: this.endTimeControl.value,
              sortByStartDate: this.sortByStartDate === 'asc' ? 1 : -1,
              sortByEndDate: this.sortByEndDate === 'asc' ? 1 : -1
            }
          }),
          extraInfo: { returnFields: 'id, startDate, endDate' }
        }
      });
      this.allAvailability = res.data.allAvailability;
      this.schedule = {
        id: 'all-availability',
        availability: this.allAvailability
      };
      this.loadedAllAvailability.emit(this.allAvailability);
    } else if (this.dvs) {
      this.dvs.noRequest();
    }
  }

  private canEval(): boolean {
    return !!(!this.allAvailability && this.scheduleIds && this.dvs);
  }
}
