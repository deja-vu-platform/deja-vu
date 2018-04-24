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

import { Target } from '../shared/scoring.model';

const SAVED_MSG_TIMEOUT = 3000;


@Component({
  selector: 'scoring-update-target',
  templateUrl: './update-target.component.html',
  styleUrls: ['./update-target.component.css']
})
export class UpdateTargetComponent
  implements OnInit, OnRun, OnAfterCommit, OnAfterAbort  {
  @Input() id: string;
  @Input() showOptionToSubmit = true;

  // Optional input value to override form control value
  @Input() set addScoreValue(addScoreValue: number) {
    this.addScoreValueControl.setValue(addScoreValue);
  }

  // Presentation inputs
  @Input() buttonLabel = 'Update';
  @Input() addScoreInputLabel = 'Add Score';
  @Input() newTargetSavedText = 'Target saved';

  @ViewChild(FormGroupDirective) form;

  addScoreValueControl = new FormControl();
  updateTargetForm: FormGroup = this.builder.group({
    addScoreValueControl: this.addScoreValueControl
  });


  targetSaved = false;
  targetError: string;

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
    if (this.id) {
      const res = await this.gs
        .post<{data: any, errors: {message: string}[]}>('/graphql', {
          query: `mutation UpdateTarget($input: UpdateTargetInput!) {
            updateTarget (input: $input)
          }`,
          variables: {
            input: {
              id: this.id,
              addScore: { value: this.addScoreValueControl.value }
            }
          }
        })
        .toPromise();

      if (res.errors) {
        throw new Error(_.map(res.errors, 'message')
          .join());
      }
    }
  }

  dvOnAfterCommit() {
    if (this.showOptionToSubmit) {
      this.targetSaved = true;
      this.targetError = '';
      window.setTimeout(() => {
        this.targetSaved = false;
      }, SAVED_MSG_TIMEOUT);
    }
    // Can't do `this.form.reset();`
    // See https://github.com/angular/material2/issues/4190
    if (this.form) {
      this.form.resetForm();
    }
  }

  dvOnAfterAbort(reason: Error) {
    if (this.showOptionToSubmit) {
      this.targetError = reason.message;
    }
  }
}
