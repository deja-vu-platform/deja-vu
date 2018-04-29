import {
  Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild
} from '@angular/core';

import {
  FormBuilder, FormControl, FormGroup, FormGroupDirective
} from '@angular/forms';

import {
  GatewayService, GatewayServiceFactory, OnAfterAbort, OnAfterCommit, OnRun,
  RunService
} from 'dv-core';

import * as _ from 'lodash';

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
    implements OnInit, OnRun, OnAfterCommit, OnAfterAbort  {
  @Input() id: string | undefined;
  @Input() targetId: string;
  @Input() showOptionToInputValue = true;
  @Input() showOptionToSubmit = true;
  @Input() save = true;
  @Output() score = new EventEmitter();

  // Optional input value to override form control value
  @Input() set value(value: number) {
    this.valueControl.setValue(value);
  }

  // Presentation inputs
  @Input() buttonLabel = 'Create';
  @Input() valueInputLabel = 'Score';
  @Input() newScoreSavedText = 'New Score saved';

  @ViewChild(FormGroupDirective) form;

  valueControl = new FormControl();
  createScoreForm: FormGroup = this.builder.group({
    valueControl: this.valueControl
  });


  newScoreSaved = false;
  newScoreError: string;

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
    const newScore: Score = {
      id: this.id,
      value: this.valueControl.value,
      targetId: this.targetId
    };
    if (this.save) {
      const res = await this.gs
        .post<CreateScoreResponse>('/graphql', {
          query: `mutation CreateScore($input: CreateScoreInput!) {
            createScore (input: $input) {
              id
            }
          }`,
          variables: {
            input: {
              id: this.id,
              value: this.valueControl.value,
              targetId: this.targetId
            }
          }
        })
        .toPromise();

      if (res.errors) {
        throw new Error(_.map(res.errors, 'message')
          .join());
      }

      newScore.id = res.data.createScore.id;
    }

    this.score.emit(newScore);
  }

  dvOnAfterCommit() {
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
    }
  }

  dvOnAfterAbort(reason: Error) {
    if (this.showOptionToSubmit && this.save) {
      this.newScoreError = reason.message;
    }
  }
}
