import {
  Component, ElementRef, EventEmitter, Inject, Input, OnChanges, OnInit,
  ViewChild
} from '@angular/core';

import {
  AbstractControl, FormBuilder, FormControl, FormGroup, FormGroupDirective,
  NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators
} from '@angular/forms';

import {
  GatewayService, GatewayServiceFactory, OnExec, OnExecFailure, OnExecSuccess,
  RunService
} from '@deja-vu/core';

import * as _ from 'lodash';

import { API_PATH } from '../schedule.config';
import { Schedule } from '../shared/schedule.model';

const SAVED_MSG_TIMEOUT = 3000;

interface ScheduleRes {
  data: { schedule: Schedule };
  errors: { message: string }[];
}

interface UpdateScheduleRes {
  data: { updateSchedule: boolean };
  errors: { message: string }[];
}

@Component({
  selector: 'schedule-update-schedule',
  templateUrl: './update-schedule.component.html',
  styleUrls: ['./update-schedule.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: UpdateScheduleComponent,
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: UpdateScheduleComponent,
      multi: true
    }
  ]
})
export class UpdateScheduleComponent implements
  OnInit, OnExec, OnExecFailure, OnExecSuccess, OnChanges {
  @Input() id: string;

  // Presentation text
  @Input() buttonLabel = 'Update Schedule';
  @Input() inputContentLabel = 'Edit Content';
  @Input() updateScheduleSavedText = 'Schedule updated';
  @Input() startEditButtonLabel = 'Edit';
  @Input() stopEditButtonLabel = 'Cancel';

  @ViewChild(FormGroupDirective) form;
  contentControl = new FormControl('', Validators.required);
  updateScheduleForm: FormGroup = this.builder.group({
    contentControl: this.contentControl
  });

  isEditing = false;
  updateScheduleSaved = false;
  updateScheduleError: string;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, private builder: FormBuilder,
    @Inject(API_PATH) private apiPath) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
    this.loadSchedule();
  }

  ngOnChanges() {
    this.loadSchedule();
  }

  loadSchedule() {
    if (!this.gs || !this.id) {
      return;
    }

    this.gs.get<ScheduleRes>(this.apiPath, {
      params: {
        inputs: { id: this.id },
        extraInfo: {
          action: 'load',
          returnFields: 'id, content'
        }
      }
    })
    .subscribe((res) => {
      const schedule = res.data.schedule;
      if (schedule) {
        this.contentControl.setValue(schedule);
      }
    });

  }

  startEditing() {
    this.isEditing = true;
  }

  stopEditing() {
    this.isEditing = false;
  }

  onSubmit() {
    this.rs.exec(this.elem);
  }

  async dvOnExec(): Promise<boolean> {
    const res = await this.gs.post<UpdateScheduleRes>(this.apiPath, {
      inputs: {
        input: {
          id: this.id,
          content: this.contentControl.value
        }
      },
      extraInfo: {
        action: 'update'
      }
    })
    .toPromise();

    if (res.errors) {
      throw new Error(_.map(res.errors, 'message')
        .join());
    }

    return res.data.updateSchedule;
  }

  dvOnExecSuccess() {
    this.updateScheduleSaved = true;
    this.updateScheduleError = '';
    window.setTimeout(() => {
      this.updateScheduleSaved = false;
    }, SAVED_MSG_TIMEOUT);
    // Can't do `this.updateTaskForm.reset();`
    // See https://github.com/angular/material2/issues/4190
    if (this.form) {
      this.form.resetForm();
    }
  }

  dvOnExecFailure(reason: Error) {
    this.updateScheduleError = reason.message;
  }
}
