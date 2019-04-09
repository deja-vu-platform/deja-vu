import {
  Component, ElementRef, Inject, Input, OnInit, ViewChild
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

import { API_PATH } from '../match.config';

interface AttemptMatchRes {
  data: { attemptMatch: boolean };
  errors: { message: string }[];
}

const SAVED_MSG_TIMEOUT = 3000;

@Component({
  selector: 'match-attempt-match',
  templateUrl: './attempt-match.component.html',
  styleUrls: ['./attempt-match.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: AttemptMatchComponent,
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: AttemptMatchComponent,
      multi: true
    }
  ]
})
export class AttemptMatchComponent implements OnInit, OnExec, OnExecFailure,
OnExecSuccess {
@Input() id: string | undefined;
@Input() set sourceId(inputContent: string) {
  this.sourceIdControl.setValue(inputContent);
}
@Input() set targetId(inputContent: string) {
  this.targetIdControl.setValue(inputContent);
}
@Input() showOptionToSubmit = true;

// Presentation inputs
@Input() buttonLabel = 'Create Attempt';
@Input() inputSourceIdLabel = 'Source Id';
@Input() inputTargetIdLabel = 'Target Id';
@Input() newAttemptSavedText = 'New attempt saved';

@ViewChild(FormGroupDirective) form;

sourceIdControl = new FormControl('', Validators.required);
targetIdControl = new FormControl('', Validators.required);
attemptMatchForm: FormGroup = this.builder.group({
  sourceIdControl: this.sourceIdControl,
  targetIdControl: this.targetIdControl
});


newMatchSaved = false;
newMatchError: string;

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
  const res = await this.gs.post<AttemptMatchRes>(this.apiPath, {
    inputs: {
      input: {
        id: this.id,
        sourceId: this.sourceIdControl.value,
        targetId: this.targetIdControl.value
      }
    }
  })
  .toPromise();

  if (res.errors) {
    throw new Error(_.map(res.errors, 'message')
      .join());
  }
}

dvOnExecSuccess() {
  this.newMatchSaved = true;
  window.setTimeout(() => {
    this.newMatchSaved = false;
  }, SAVED_MSG_TIMEOUT);
  // Can't do `this.form.reset();`
  // See https://github.com/angular/material2/issues/4190
  if (this.form) {
    this.form.resetForm();
  }
}

dvOnExecFailure(reason: Error) {
  this.newMatchError = reason.message;
}
}
