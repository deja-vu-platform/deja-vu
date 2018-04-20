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

import { Publisher } from '../shared/follow.model';

const SAVED_MSG_TIMEOUT = 3000;

@Component({
  selector: 'follow-edit-publisher',
  templateUrl: './edit-publisher.component.html',
  styleUrls: ['./edit-publisher.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: EditPublisherComponent,
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: EditPublisherComponent,
      multi: true
    }
  ]
})
export class EditPublisherComponent implements
  OnInit, OnRun, OnAfterAbort, OnAfterCommit {
  @ViewChild(FormGroupDirective) form;
  oldPublisherIdControl = new FormControl('', Validators.required);
  newPublisherIdControl = new FormControl('', Validators.required);
  editPublisherForm: FormGroup = this.builder.group({
    oldPublisherIdControl: this.oldPublisherIdControl,
    newPublisherIdControl: this.newPublisherIdControl
  });

  @Input() set oldId(id: string) {
    this.oldPublisherIdControl.setValue(id);
  }

  @Input() set newId(id: string) {
    this.newPublisherIdControl.setValue(id);
  }

  // Presentation text
  @Input() buttonLabel = 'Update Publisher';
  @Input() oldPublisherIdLabel = 'Enter your current publisher id';
  @Input() newPublisherIdLabel = 'Enter your new publisher id';
  @Input() editPublisherSavedText = 'Publisher updated';

  editPublisherSaved = false;
  editPublisherError: string;

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
      query: `mutation EditPublisher($input: EditPublisherInput!) {
            editPublisher(input: $input)
          }`,
      variables: {
        input: {
          oldId: this.oldPublisherIdControl.value,
          newId: this.newPublisherIdControl.value
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
    this.editPublisherSaved = true;
    this.editPublisherError = '';
    window.setTimeout(() => {
      this.editPublisherSaved = false;
    }, SAVED_MSG_TIMEOUT);
    // Can't do `this.form.reset();`
    // See https://github.com/angular/material2/issues/4190
    if (this.form) {
      this.form.resetForm();
    }
  }

  dvOnAfterAbort(reason: Error) {
    this.editPublisherError = reason.message;
  }
}
