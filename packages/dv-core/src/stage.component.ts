import {
  Component, EventEmitter, Input, OnInit, Output, ViewChild
} from '@angular/core';
import {
  ControlValueAccessor, FormBuilder, FormControl, FormGroupDirective,
  FormGroup, NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, Validator
} from '@angular/forms';

import * as _ from 'lodash';

import { Action } from './include.component';


@Component({
  selector: 'dv-stage',
  templateUrl: './stage.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: StageComponent,
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: StageComponent,
      multi: true
    }
  ]
})
export class StageComponent implements OnInit, ControlValueAccessor, Validator {
  // for staging
  @Input() initialStagedEntities: any[] = [];
  @Output() stagedEntities = new EventEmitter<any[]>();

  @Input() stageHeader: Action | undefined;
  @Input() stageEntity: Action | undefined;
  @Input() showEntity: Action | undefined;

  // Presentation inputs
  @Input() stageButtonLabel = 'Add';

  stageComponent = this;
  staged: any[] = [];

  entityControl = new FormControl();

  @ViewChild(FormGroupDirective) form;
  stageForm: FormGroup = this.builder.group({
    entityControl: this.entityControl
  });

  constructor(private builder: FormBuilder) {}

  ngOnInit() {
    this.staged = this.initialStagedEntities;
  }

  onSubmit() {
    this.stage(this.entityControl.value);
    // Can't do `this.form.reset();`
    // See https://github.com/angular/material2/issues/4190
    if (this.form) {
      this.form.resetForm();
      this.entityControl.reset();
    }
  }

  stage(value: any) {
    this.staged.push(value);
    this.stagedEntities.emit(this.staged);
  }

  unstage(index: string) {
    _.pullAt(this.staged, index);
    this.stagedEntities.emit(this.staged);
  }

  writeValue(value: any[]) {
    if (value) {
      this.staged = value;
    } else {
      this.staged = [];
    }
    this.stagedEntities.emit(this.staged);
  }

  registerOnChange(fn: (value: string) => void) {
    this.stagedEntities.subscribe(fn);
  }

  registerOnTouched() {}

  validate(_c: FormControl): ValidationErrors {
    return {};
  }
}
