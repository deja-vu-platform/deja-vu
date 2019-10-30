import {
  Component, ElementRef, EventEmitter, Inject, Input, OnInit, Output, ViewChild
} from '@angular/core';

import {
  FormBuilder, FormControl, FormGroup, FormGroupDirective
} from '@angular/forms';

import {
  DvService, DvServiceFactory, OnExec, OnExecFailure, OnExecSuccess
} from '@deja-vu/core';

import * as _ from 'lodash';

import { API_PATH } from '../scoring.config';
import { Score } from '../shared/scoring.model';

interface CreateScoreResponse {
  data: {createScore: Score};
  errors: {message: string}[];
}

const SAVED_MSG_TIMEOUT = 3000;

@Component({
  selector: 'scoring-create-score',
  templateUrl: './create-score.component.html',
  styleUrls: ['./create-score.component.css']
})
export class CreateScoreComponent
  implements OnInit, OnExec, OnExecSuccess, OnExecFailure  {
  @Input() id: string | undefined;
  @Input() sourceId: string;
  @Input() targetId: string;
  @Input() showOptionToInputValue = true;
  @Input() showOptionToSubmit = true;
  @Input() save = true;
  @Output() score = new EventEmitter();

  // Optional input value to override form control value
  @Input() set value(value: number) {
    this.initialValue = value;
    this.valueControl.setValue(value);
  }

  // Presentation inputs
  @Input() buttonDisabled = false; // button remains disabled for invalid inputs
  @Input() buttonLabel = 'Create';
  @Input() valueInputLabel = 'Score';
  @Input() newScoreSavedText = 'New Score saved';
  @Input() showDoneMessage = true;
  @Input() submitMatIconName: string | undefined;

  @ViewChild(FormGroupDirective) form;

  valueControl = new FormControl();
  createScoreForm: FormGroup = this.builder.group({
    valueControl: this.valueControl
  });


  newScoreSaved = false;
  newScoreError: string;

  private dvs: DvService;
  private initialValue;

  constructor(
    private readonly elem: ElementRef, private readonly dvf: DvServiceFactory,
    private readonly builder: FormBuilder,
    @Inject(API_PATH) private readonly apiPath) {}

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .build();
  }

  onSubmit() {
    this.dvs.exec();
  }

  async dvOnExec(): Promise<void> {
    const newScore: Score = {
      id: this.id,
      value: this.valueControl.value,
      sourceId: this.sourceId,
      targetId: this.targetId
    };
    if (this.save) {
      const res = await this.dvs
        .post<CreateScoreResponse>(this.apiPath, {
          inputs: {
            input: {
              id: this.id,
              value: this.valueControl.value,
              sourceId: this.sourceId,
              targetId: this.targetId
            }
          },
          extraInfo: { returnFields: 'id' }
        });

      if (res.errors) {
        throw new Error(_.map(res.errors, 'message')
          .join());
      }

      newScore.id = res.data.createScore.id;
    } else {
      this.dvs.noRequest();
    }

    this.score.emit(newScore);
  }

  dvOnExecSuccess() {
    if (this.showOptionToSubmit && this.save) {
      this.newScoreSaved = true;
      this.newScoreError = '';
      window.setTimeout(() => {
        this.newScoreSaved = false;
      }, SAVED_MSG_TIMEOUT);
    }
    // Can't do `this.form.reset();`
    // See https://github.com/angular/material2/issues/4190
    if (this.form) {
      this.form.resetForm();
      this.valueControl.setValue(this.initialValue);
    }
  }

  dvOnExecFailure(reason: Error) {
    if (this.showOptionToSubmit && this.save) {
      this.newScoreError = reason.message;
    }
  }

  canSubmit(): boolean {
    return this.createScoreForm.valid && this.canExec() && !this.buttonDisabled;
  }

  private canExec() {
    return !_.isNil(this.valueControl.value) && this.sourceId && this.targetId;
  }
}
