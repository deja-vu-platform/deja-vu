import {
  AfterViewInit, Component, ElementRef, Inject, Input, OnChanges, OnInit,
  ViewChild
} from '@angular/core';

import {
  FormBuilder, FormControl, FormGroup, FormGroupDirective, NG_VALIDATORS,
  NG_VALUE_ACCESSOR, Validators
} from '@angular/forms';

import {
  DvService, DvServiceFactory, OnExec, OnExecFailure, OnExecSuccess
} from '@deja-vu/core';

import * as _ from 'lodash';

import { API_PATH } from '../scoring.config';
import { Score } from '../shared/scoring.model';

const SAVED_MSG_TIMEOUT = 3000;

interface ScoreRes {
  data: { score: Score };
  errors: { message: string }[];
}

interface UpdateScoreRes {
  data: { updateScore: boolean };
  errors: { message: string }[];
}

@Component({
  selector: 'scoring-update-score',
  templateUrl: './update-score.component.html',
  styleUrls: ['./update-score.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: UpdateScoreComponent,
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: UpdateScoreComponent,
      multi: true
    }
  ]
})
export class UpdateScoreComponent
  implements AfterViewInit, OnInit, OnExec, OnExecFailure, OnExecSuccess,
    OnChanges {
  @Input() waitOn: string[];
  @Input() id: string;
  @Input() value: number;

  // Presentation text
  @Input() buttonLabel = 'Update Score';
  @Input() inputValueLabel = 'Edit Value';
  @Input() updateScoreSavedText = 'Score updated';
  @Input() startEditButtonLabel = 'Edit';
  @Input() stopEditButtonLabel = 'Cancel';

  @ViewChild(FormGroupDirective) form;
  valueControl = new FormControl('', Validators.required);
  updateScoreForm: FormGroup = this.builder.group({
    valueControl: this.valueControl
  });

  isEditing = false;
  updateScoreSaved = false;
  updateScoreError: string;

  private dvs: DvService;

  constructor(
    private readonly elem: ElementRef, private readonly dvf: DvServiceFactory,
    private readonly builder: FormBuilder,
    @Inject(API_PATH) private readonly apiPath) {}

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .withDefaultWaiter()
      .build();
  }

  ngAfterViewInit() {
    this.load();
  }

  ngOnChanges(changes) {
    if (this.dvs && this.dvs.waiter.processChanges(changes)) {
      this.load();
    }
  }

  load() {
    if (this.canEval()) {
      this.dvs.eval();
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      const res = await this.dvs.waitAndGet<ScoreRes>(this.apiPath, () => ({
        params: {
          inputs: {
            input: { id: this.id }
          },
          extraInfo: {
            action: 'load',
            returnFields: 'id, value'
          }
        }
      }));
      const score = res.data.score;
      if (score) {
        this.valueControl.setValue(score.value);
      }
    }
  }

  startEditing() {
    this.isEditing = true;
  }

  stopEditing() {
    this.isEditing = false;
  }

  onSubmit() {
    this.dvs.exec();
  }

  async dvOnExec(): Promise<boolean> {
    const res = await this.dvs.post<UpdateScoreRes>(this.apiPath, {
      inputs: {
        input: {
          id: this.id,
          value: this.valueControl.value
        }
      },
      extraInfo: {
        action: 'update'
      }
    });

    if (res.errors) {
      throw new Error(_.map(res.errors, 'message')
        .join());
    }

    return res.data.updateScore;
  }

  dvOnExecSuccess() {
    this.updateScoreSaved = true;
    this.updateScoreError = '';
    window.setTimeout(() => {
      this.updateScoreSaved = false;
    }, SAVED_MSG_TIMEOUT);
    // Can't do `this.updateTaskForm.reset();`
    // See https://github.com/angular/material2/issues/4190
    if (this.form) {
      this.form.resetForm();
    }
  }

  dvOnExecFailure(reason: Error) {
    this.updateScoreError = reason.message;
  }

  private canEval(): boolean {
    return !!this.dvs;
  }
}
