import {
  AfterViewInit, Component, ElementRef, EventEmitter, Input, OnInit, Output,
  ViewChild
} from '@angular/core';
import {
  AbstractControl, FormBuilder, FormControl, FormGroup, FormGroupDirective,
  Validators
} from '@angular/forms';
import {
  GatewayService, GatewayServiceFactory, OnExec, OnExecFailure, OnExecSuccess,
  RunService
} from '@deja-vu/core';

import * as _ from 'lodash';

import { Event, fromUnixTime, toUnixTime } from '../../../../shared/data';
import { endTimeValidator } from '../shared/time.validator';


const SAVED_MSG_TIMEOUT = 3000;

@Component({
  selector: 'event-update-event',
  templateUrl: './update-event.component.html'
})
export class UpdateEventComponent
  implements OnExec, OnExecSuccess, OnExecFailure, OnInit {
  @Input() id: string;
  @Input() showOptionToSubmit = true;

  // Presentation inputs
  @Input() buttonLabel = 'Update Event';
  @Input() updateEventSavedText = 'Event updated';

  @ViewChild(FormGroupDirective) form;

  startsOnControl = new FormControl('', [Validators.required]);
  endsOnControl = new FormControl('', [Validators.required]);
  startTimeControl = new FormControl('', [Validators.required]);
  endTimeControl = new FormControl('', [
    Validators.required,
    endTimeValidator(() => this.startTimeControl.value)
  ]);

  updateEventForm: FormGroup = this.builder.group({
    startsOn: this.startsOnControl,
    endsOn: this.endsOnControl,
    startTime: this.startTimeControl,
    endTime: this.endTimeControl
  });

  updateEventSaved = false;
  updateEventError: string;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, private builder: FormBuilder) {}

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  onSubmit() {
    console.log("on exec");
    console.log(this.startsOnControl.value);
    console.log(this.startTimeControl.value);
    this.rs.exec(this.elem);
  }

  async dvOnExec(): Promise<void> {
    const res = await this.gs
      .post<{data: any}>('/graphql', {
        inputs: {
          input: {
            id: this.id,
            startDate: toUnixTime(
              this.startsOnControl.value, this.startTimeControl.value),
            endDate: toUnixTime(
              this.endsOnControl.value, this.endTimeControl.value)
          }
        },
        extraInfo: { returnFields: ''}
      })
      .toPromise();
  }

  setInitialValues(value) {
    console.log("set initial values");
    console.log(this.id);
    console.log(value);
    console.log(value.startDate);
    console.log((value.startDate));
    if (!value) {
      console.log('value is empty');
    }
    this.startsOnControl.setValue(value.startDate.toDate());
    this.startTimeControl.setValue(value.startDate.format('hh:mm'));
    this.endsOnControl.setValue(value.endDate.toDate());
    this.endTimeControl.setValue(value.endDate.format('hh:mm'));
  }

  dvOnExecSuccess() {
    console.log("on exec");
    console.log(this.startsOnControl.value);
    console.log(this.startTimeControl.value);
    if (this.showOptionToSubmit) {
      this.updateEventSaved = true;
      window.setTimeout(() => {
        this.updateEventSaved = false;
      }, SAVED_MSG_TIMEOUT);
    }
  }

  dvOnExecFailure(reason: Error) {
    console.log("on exec");
    console.log(this.startsOnControl.value);
    console.log(this.startTimeControl.value);
    if (this.showOptionToSubmit) {
      this.updateEventError = reason.message;
    }
  }
}
