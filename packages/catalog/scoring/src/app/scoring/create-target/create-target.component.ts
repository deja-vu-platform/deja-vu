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

interface CreateTargetResponse {
  data: {createTarget: Target};
  errors: {message: string}[];
}

const SAVED_MSG_TIMEOUT = 3000;


@Component({
  selector: 'scoring-create-target',
  templateUrl: './create-target.component.html',
  styleUrls: ['./create-target.component.css']
})
export class CreateTargetComponent
  implements OnInit, OnRun, OnAfterCommit, OnAfterAbort  {
  @Input() id: string | undefined = '';
  @Input() showOptionToInputInitialScore = true;
  @Input() showOptionToSubmit = true;
  @Input() useInitialScore = true;
  @Input() save = true;
  @Output() target = new EventEmitter();

  // Optional input value to override form control value
  @Input() set initialScore(initialScore: number) {
    this.initialScoreControl.setValue(initialScore);
  }

  // Presentation inputs
  @Input() buttonLabel = 'Create';
  @Input() createScoreInputLabel = 'Score';
  @Input() newTargetSavedText = 'New Target saved';

  @ViewChild(FormGroupDirective) form;

  initialScoreControl = new FormControl();
  createTargetForm: FormGroup = this.builder.group({
    initialScoreControl: this.initialScoreControl
  });


  newTargetSaved = false;
  newTargetError: string;

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
    const newTarget = {
      id: this.id,
      scores: [],
      total: undefined
    };
    if (this.useInitialScore) {
      newTarget.scores = [ { value: this.initialScoreControl.value } ];
    }
    if (this.save) {
      const res = await this.gs
        .post<CreateTargetResponse>('/graphql', {
          query: `mutation CreateTarget($input: CreateTargetInput!) {
            createTarget (input: $input) {
              id
              scores { id, value }
              total
            }
          }`,
          variables: {
            input: {
              id: this.id,
              initialScore: this.useInitialScore ?
                { value: this.initialScoreControl.value } : undefined 
            }
          }
        })
        .toPromise();

      if (res.errors) {
        throw new Error(_.map(res.errors, 'message')
          .join());
      }

      newTarget.id = res.data.createTarget.id;
      newTarget.total = res.data.createTarget.total;
      if (this.useInitialScore) {
        newTarget.scores[0].id = res.data.createTarget.scores[0].id
      }
    }

    this.target.emit(newTarget);
  }

  dvOnAfterCommit() {
    if (this.showOptionToSubmit && this.save) {
      this.newTargetSaved = true;
      this.newTargetError = '';
      window.setTimeout(() => {
        this.newTargetSaved = false;
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
      this.newTargetError = reason.message;
    }
  }
}
