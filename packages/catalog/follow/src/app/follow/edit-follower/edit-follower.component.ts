import {
  Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, ViewChild
} from '@angular/core';

import {
  AbstractControl, FormBuilder, FormControl, FormGroup, FormGroupDirective,
  NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators
} from '@angular/forms';

import {
  GatewayService, GatewayServiceFactory, OnAfterAbort, OnAfterCommit, OnRun,
  RunService
} from 'dv-core';

import * as _ from 'lodash';

import { Follower } from '../shared/follow.model';

const SAVED_MSG_TIMEOUT = 3000;

@Component({
  selector: 'follow-edit-follower',
  templateUrl: './edit-follower.component.html',
  styleUrls: ['./edit-follower.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: EditFollowerComponent,
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: EditFollowerComponent,
      multi: true
    }
  ]
})
export class EditFollowerComponent implements
  OnInit, OnRun, OnAfterAbort, OnAfterCommit {

  @Input() set oldId(id: string) {
    this.oldFollowerIdControl.setValue(id);
  }

  @Input() set newId(id: string) {
    this.newFollowerIdControl.setValue(id);
  }

  // Presentation text
  @Input() buttonLabel = 'Update Follower';
  @Input() oldFollowerIdLabel = 'Enter your current follower id';
  @Input() newFollowerIdLabel = 'Enter your new follower id';
  @Input() editFollowerSavedText = 'Follower updated';

  @Input() showOptionToSubmit = true;

  @ViewChild(FormGroupDirective) form;
  oldFollowerIdControl = new FormControl('', Validators.required);
  newFollowerIdControl = new FormControl('', Validators.required);
  editFollowerForm: FormGroup = this.builder.group({
    oldFollowerIdControl: this.oldFollowerIdControl,
    newFollowerIdControl: this.newFollowerIdControl
  });

  editFollowerSaved = false;
  editFollowerError: string;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, private builder: FormBuilder) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  onSubmit() {
    this.rs.run(this.elem);
  }

  async dvOnRun(): Promise<Boolean> {
    const res = await this.gs.post<{
      data: any, errors: { message: string }[]
    }>('/graphql', {
      query: `mutation EditFollower($input: EditFollowerInput!) {
            editFollower(input: $input)
          }`,
      variables: {
        input: {
          oldId: this.oldFollowerIdControl.value,
          newId: this.newFollowerIdControl.value
        }
      }
    })
      .toPromise();

    if (res.errors) {
      throw new Error(_.map(res.errors, 'message')
        .join());
    }

    return true;
  }

  dvOnAfterCommit() {
    this.editFollowerSaved = true;
    this.editFollowerError = '';
    window.setTimeout(() => {
      this.editFollowerSaved = false;
    }, SAVED_MSG_TIMEOUT);
    // Can't do `this.form.reset();`
    // See https://github.com/angular/material2/issues/4190
    if (this.form) {
      this.form.resetForm();
    }
  }

  dvOnAfterAbort(reason: Error) {
    this.editFollowerError = reason.message;
  }
}
