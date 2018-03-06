import {
  Component, AfterViewInit, ElementRef, Input, OnInit, Output,
  EventEmitter, ViewChild
} from '@angular/core';
import { FormBuilder, FormGroup, FormGroupDirective, FormControl, AbstractControl, Validators } from '@angular/forms';
import {
  GatewayServiceFactory, GatewayService, RunService, OnRun, OnAfterCommit,
  OnAfterAbort
} from 'dv-core';

import * as _ from 'lodash';

import { Event } from '../../../../shared/data';


const SAVED_MSG_TIMEOUT = 3000;

@Component({
  selector: 'event-new-weekly-event',
  templateUrl: './new-weekly-event.component.html',
  styleUrls: ['./new-weekly-event.component.css']
})
export class NewWeeklyEventComponent implements
  OnInit, OnRun, OnAfterCommit, OnAfterAbort {
  @Input() id = ''; // optional
  @Output() events = new EventEmitter<Event[]>();

  // Presentation inputs
  @Input() buttonLabel = 'Create Weekly Event';
  @Input() newWeeklyEventSavedText = 'New weekly event saved';

  @ViewChild(FormGroupDirective) form;

  startsOn = new FormControl('', [Validators.required]);
  endsOn = new FormControl('', [Validators.required]);
  startTime = new FormControl('', [Validators.required]);
  endTime = new FormControl('', [
    Validators.required,
    (control: AbstractControl): {[key: string]: any} => {
      const startTime = this.startTime.value;
      const endTime = control.value;
      if (!(startTime && endTime)) {
        return null;
      }
      const {hh: startHh, mm: startMm} = this.getHhMm(startTime);
      const {hh: endHh, mm: endMm} = this.getHhMm(endTime);
      if (startHh > endHh || (startHh === endHh && startMm >= endMm)) {
        return {
          'endBeforeStart': {
            startTime: startTime, endTime: endTime
          }
        };
      }
      return null;
    }
  ]);

  newWeeklyEventForm: FormGroup = this.builder.group({
    startsOn: this.startsOn,
    endsOn: this.endsOn,
    startTime: this.startTime,
    endTime: this.endTime
  });

  newWeeklyEventSaved = false;
  newWeeklyEventError: string;

  gs: GatewayService;

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
    this.events.emit(_.map(res.data.createWeeklyEvent.events, evt => {
      evt.weeklyEventId = evt.weeklyEvent.id;
      return evt;
    }));
  }

  dvOnAfterCommit() {
    this.newWeeklyEventSaved = true;
    window.setTimeout(() => {
      this.newWeeklyEventSaved = false;
    }, SAVED_MSG_TIMEOUT);
    // https://github.com/angular/material2/issues/4190
    // this.newWeeklyEventForm.reset();
    if (this.form) {
      this.form.resetForm();
    }
  }

  dvOnAfterAbort(reason: Error) {
    this.newWeeklyEventError = reason.message;
  }

  // Get the hours and minutes in 24-hour format from a time in 12-hr format
  // (hh:mm AM/PM)
  private getHhMm(hhMmTime: string): {hh: number, mm: number} {
    const hhMm = hhMmTime.slice(0, -2).split(':');
    const ret = {hh: Number(hhMm[0]), mm: Number(hhMm[1])};
    if (hhMmTime.slice(-2) === 'PM') {
      ret.hh = ret.hh + 12;
    }
    return ret;
  }
}
