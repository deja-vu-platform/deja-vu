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
import { Slot } from '../shared/schedule.model';
import {
  endDateValidator, endTimeValidator
} from '../shared/schedule.validator';

import { ShowSlotComponent } from '../show-slot/show-slot.component';

// https://github.com/dherges/ng-packagr/issues/217
import * as momentImported from 'moment'; const moment = momentImported;

interface SlotsRes {
  data: { slots: Slot[] };
}


@Component({
  selector: 'schedule-show-slots',
  templateUrl: './show-slots.component.html',
  styleUrls: ['./show-slots.component.css']
})
export class ShowSlotsComponent
  implements AfterViewInit, OnChanges, OnEval, OnInit {
  // Provide one of the following: scheduleId or slots
  @Input() scheduleId: string | undefined;
  @Input() slots: Slot[] | undefined;
  @Input() showDateTimePicker = true;

  @Input() buttonLabel = 'Filter Availability';

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

  @Output() loadedSlots = new EventEmitter();

  @Input() showId = true;
  @Input() showStartDate = true;
  @Input() showEndDate = true;

  // See https://angular.io/api/common/DatePipe
  @Input() dateTimeFormatString = 'medium';

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


  showSlots;
  private dvs: DvService;

  constructor(
    private elem: ElementRef, private dvf: DvServiceFactory,
    private builder: FormBuilder, @Inject(API_PATH) private apiPath) {
    this.showSlots = this;
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
      const res = await this.dvs.get<SlotsRes>(this.apiPath, {
        params: {
          inputs: JSON.stringify({
            input: {
              scheduleId: this.scheduleId,
              startDate: startDate,
              endDate: endDate,
              startTime: this.startTimeControl.value,
              endTime: this.endTimeControl.value,
              sortByStartDate: this.sortByStartDate === 'asc' ? 1 : -1,
              sortByEndDate: this.sortByEndDate === 'asc' ? 1 : -1
            }
          }),
          extraInfo: {
            returnFields: `
                ${this.showId ? 'id' : ''}
                ${this.showStartDate ? 'startDate' : ''}
                ${this.showEndDate ? 'endDate' : ''}
              `
          }
        }
      });
      this.slots = res.data.slots;
      this.loadedSlots.emit(this.slots);
    } else if (this.dvs) {
      this.dvs.noRequest();
    }
  }

  private canEval(): boolean {
    return !!(!this.slots && this.scheduleId && this.dvs);
  }
}
