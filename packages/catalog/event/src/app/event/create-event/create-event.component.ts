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
  selector: 'event-create-event',
  templateUrl: './create-event.component.html',
  styleUrls: ['./create-event.component.css']
})
export class CreateEventComponent
implements OnInit, OnRun, OnAfterCommit, OnAfterAbort {
  @Input() id: string | undefined = '';
  @Input() showOptionToSubmit = true;

  // Presentation inputs
  @Input() buttonLabel = 'Create Event';
  @Input() createEventSavedText = 'New event saved';

  @ViewChild(FormGroupDirective) form;

  startsOn = new FormControl('', [Validators.required]);
  endsOn = new FormControl('', [Validators.required]);
  startTime = new FormControl('', [Validators.required]);
  endTime = new FormControl('', [
    Validators.required,
    endTimeValidator(() => this.startTime.value)
  ]);

  createEventForm: FormGroup = this.builder.group({
    startsOn: this.startsOn,
    endsOn: this.endsOn,
    startTime: this.startTime,
    endTime: this.endTime
  });

  createEventSaved = false;
  createEventError: string;

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
        query: `mutation CreateEvent($input: CreateEventInput!) {
          createEvent(input: $input) {
            id
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
  }

  dvOnAfterCommit() {
    if (this.showOptionToSubmit) {
      this.createEventSaved = true;
      window.setTimeout(() => {
        this.createEventSaved = false;
      }, SAVED_MSG_TIMEOUT);
    }
    // Can't do `this.createEventForm.reset();`
    // See https://github.com/angular/material2/issues/4190
    if (this.form) {
      this.form.resetForm();
    }
  }

  dvOnAfterAbort(reason: Error) {
    if (this.showOptionToSubmit) {
      this.createEventError = reason.message;
    }
  }
}
