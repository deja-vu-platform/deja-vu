import {
  AfterViewInit, Component, ElementRef, EventEmitter, Input, OnInit, Output,
  ViewChild
} from '@angular/core';
import {
  AbstractControl, FormBuilder, FormControl, FormGroup, FormGroupDirective,
  Validators
} from '@angular/forms';
import {
  GatewayService, GatewayServiceFactory, OnAfterAbort, OnAfterCommit, OnRun,
  RunService
} from 'dv-core';

import * as _ from 'lodash';

import { Event } from '../../../../shared/data';
import { endTimeValidator } from '../shared/time.validator';


const SAVED_MSG_TIMEOUT = 3000;

@Component({
  selector: 'event-new-weekly-event',
  templateUrl: './new-weekly-event.component.html',
  styleUrls: ['./new-weekly-event.component.css']
})
export class NewWeeklyEventComponent implements
  OnInit, OnRun, OnAfterCommit, OnAfterAbort {
  @Input() id: string | undefined = '';
  @Input() showOptionToSubmit = true;
  @Output() events = new EventEmitter<Event[]>();

  // Presentation inputs
  @Input() buttonLabel = 'Create Weekly Event';
  @Input() newWeeklyEventSavedText = 'New weekly event saved';

  @ViewChild(FormGroupDirective) form;

  startsOn = new FormControl('', [Validators.required]);
  endsOn = new FormControl('', [Validators.required]);
  startTime = new FormControl('', [Validators.required]);
  endTime = new FormControl('', [
    Validators.required, endTimeValidator(() => this.startTime.value)
  ]);

  newWeeklyEventForm: FormGroup = this.builder.group({
    startsOn: this.startsOn,
    endsOn: this.endsOn,
    startTime: this.startTime,
    endTime: this.endTime
  });

  newWeeklyEventSaved = false;
  newWeeklyEventError: string;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, private builder: FormBuilder) {}

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  onSubmit() {
    this.rs.run(this.elem);
  }

  async dvOnRun(): Promise<void> {
    const res = await this.gs
      .post<{data: any}>('/graphql', {
        query: `mutation CreateWeeklyEvent($input: CreateWeeklyEventInput!) {
          createWeeklyEvent(input: $input) {
            id,
            events {
              id,
              startDate,
              endDate,
              weeklyEvent {
                id
              }
            }
          }
        }`,
        variables: {
          input: {
            id: this.id ? this.id : '',
            startsOn: this.startsOn.value.valueOf(),
            endsOn: this.endsOn.value.valueOf(),
            startTime: this.startTime.value,
            endTime: this.endTime.value
          }
        }
      })
     .toPromise();
    this.events.emit(_.map(res.data.createWeeklyEvent.events, (evt) => {
      evt.weeklyEventId = evt.weeklyEvent.id;

      return evt;
    }));
  }

  dvOnAfterCommit() {
    this.newWeeklyEventSaved = true;
    window.setTimeout(() => {
      this.newWeeklyEventSaved = false;
    }, SAVED_MSG_TIMEOUT);
    // Can't do `this.newWeeklyEventForm.reset();`
    // See https://github.com/angular/material2/issues/4190
    if (this.form) {
      this.form.resetForm();
    }
  }

  dvOnAfterAbort(reason: Error) {
    this.newWeeklyEventError = reason.message;
  }
}
