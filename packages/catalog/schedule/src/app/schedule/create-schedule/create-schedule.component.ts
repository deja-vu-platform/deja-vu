import {
  Component, ElementRef, EventEmitter, Inject, Input, OnInit, Output, ViewChild
} from '@angular/core';
import {
  FormBuilder, FormControl, FormGroup, FormGroupDirective,
  NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators
} from '@angular/forms';
import {
  GatewayService, GatewayServiceFactory, OnExec, OnExecFailure, OnExecSuccess,
  RunService
} from '@deja-vu/core';

import * as _ from 'lodash';

import { API_PATH } from '../schedule.config';
import { Schedule } from '../shared/schedule.model';


interface CreateScheduleRes {
  data: { createSchedule: Schedule };
  errors: { message: string }[];
}

const SAVED_MSG_TIMEOUT = 3000;

@Component({
  selector: 'schedule-create-schedule',
  templateUrl: './create-schedule.component.html',
  styleUrls: ['./create-schedule.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: CreateScheduleComponent,
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: CreateScheduleComponent,
      multi: true
    }
  ]
})
export class CreateScheduleComponent implements OnInit, OnExec, OnExecFailure,
  OnExecSuccess {
  @Input() id: string | undefined;
  @Input() set content(inputContent: string) {
    this.contentControl.setValue(inputContent);
  }
  @Input() showOptionToSubmit = true;

  // Presentation inputs
  @Input() buttonLabel = 'Create Schedule';
  @Input() inputContentLabel = 'Content';
  @Input() newScheduleSavedText = 'New schedule saved';

  @ViewChild(FormGroupDirective) form;

  contentControl = new FormControl('', Validators.required);
  createScheduleForm: FormGroup = this.builder.group({
    contentControl: this.contentControl
  });


  newScheduleSaved = false;
  newScheduleError: string;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, private builder: FormBuilder,
    @Inject(API_PATH) private apiPath) {}

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  onSubmit() {
    this.rs.exec(this.elem);
  }

  async dvOnExec(): Promise<void> {
    const res = await this.gs.post<CreateScheduleRes>(this.apiPath, {
      inputs: {
        input: {
          id: this.id,
          content: this.contentControl.value
        }
      },
      extraInfo: { returnFields: 'id' }
    })
    .toPromise();

    if (res.errors) {
      throw new Error(_.map(res.errors, 'message')
        .join());
    }
  }

  dvOnExecSuccess() {
    this.newScheduleSaved = true;
    window.setTimeout(() => {
      this.newScheduleSaved = false;
    }, SAVED_MSG_TIMEOUT);
    // Can't do `this.form.reset();`
    // See https://github.com/angular/material2/issues/4190
    if (this.form) {
      this.form.resetForm();
    }
  }

  dvOnExecFailure(reason: Error) {
    this.newScheduleError = reason.message;
  }
}
