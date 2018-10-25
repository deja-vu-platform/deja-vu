import {
  AfterViewInit, Component, ElementRef, EventEmitter, Input, OnInit, Output,
  ViewChild
} from '@angular/core';
import {
  AbstractControl, FormBuilder, FormControl, FormGroup, FormGroupDirective,
  Validators
} from '@angular/forms';
import {
  GatewayService,
  GatewayServiceFactory,
  OnExecAbort,
  OnExecCommit,
  OnExec,
  RunService
} from 'dv-core';

import * as _ from 'lodash';

import * as moment from 'moment';

import { Event, fromUnixTime, toUnixTime } from '../../../../shared/data';
import { endTimeValidator } from '../shared/time.validator';


const SAVED_MSG_TIMEOUT = 3000;

@Component({
  selector: 'event-create-weekly-series',
  templateUrl: './create-weekly-series.component.html',
  styleUrls: ['./create-weekly-series.component.css']
})
export class CreateWeeklySeriesComponent
implements OnInit, OnExec, OnExecCommit, OnExecAbort {
  @Input() id: string | undefined = '';
  @Input() showOptionToSubmit = true;
  @Input() save = true;
  @Output() seriesEvents = new EventEmitter<Event[]>();
  _seriesEvents: Event[] = [];

  // Presentation inputs
  @Input() buttonLabel = 'Create Weekly Event';
  @Input() createWeeklySeriesSavedText = 'New weekly event saved';

  @ViewChild(FormGroupDirective) form;

  startsOnControl = new FormControl('', [Validators.required]);
  endsOnControl = new FormControl('', [Validators.required]);
  startTimeControl = new FormControl('', [Validators.required]);
  endTimeControl = new FormControl('', [
    Validators.required, endTimeValidator(() => this.startTimeControl.value)
  ]);

  createWeeklySeriesForm: FormGroup = this.builder.group({
    startsOn: this.startsOnControl,
    endsOn: this.endsOnControl,
    startTime: this.startTimeControl,
    endTime: this.endTimeControl
  });

  createWeeklySeriesSaved = false;
  createWeeklySeriesError: string;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, private builder: FormBuilder) {}

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
    this.createWeeklySeriesForm
      .statusChanges
      .subscribe((st: 'VALID' | 'INVALID') => {
        if (st === 'VALID') {
          this._seriesEvents = this.getSeriesEvents();
          this.seriesEvents.emit(this._seriesEvents);
        }
      });
  }

  onSubmit() {
    this.rs.exec(this.elem);
  }

  dvOnExec(): Promise<any> {
    if (this.save) {
      return this.gs
        .post<{data: any}>('/graphql', {
          query: `mutation CreateSeries($input: CreateSeriesInput!) {
            createSeries(input: $input) {
              id
            }
          }`,
          variables: {
            input: {
              id: this.id ? this.id : '',
              events: this._seriesEvents
            }
          }
        })
        .toPromise();
    }
  }

  dvOnExecCommit() {
    if (this.save) {
      this.createWeeklySeriesSaved = true;
      window.setTimeout(() => {
        this.createWeeklySeriesSaved = false;
      }, SAVED_MSG_TIMEOUT);
      // Can't do `this.createWeeklySeriesForm.reset();`
      // See https://github.com/angular/material2/issues/4190
    }
    if (this.form) {
      this.form.resetForm();
    }
  }

  dvOnExecAbort(reason: Error) {
    if (this.save) {
      this.createWeeklySeriesError = reason.message;
    }
  }

  getSeriesEvents(): Event[] {
    const startsOnDate: moment.Moment = this.startsOnControl.value;
    const endsOnDate: moment.Moment = this.endsOnControl.value;

    const events = [];
    for (
      const eventDate = startsOnDate.clone(); eventDate <= endsOnDate;
      eventDate.add(1, 'w')) {

      const e = {
        startDate: toUnixTime(eventDate, this.startTimeControl.value),
        endDate: toUnixTime(eventDate, this.endTimeControl.value),
        seriesId: this.id
      };
      events.push(e);
    }

    return events;
  }
}
