import {
  AfterViewChecked, ChangeDetectorRef, Component, ElementRef, EventEmitter,
  Input, OnInit, Output, ViewChild
} from '@angular/core';
import {
  ControlValueAccessor, FormBuilder, FormControl, FormGroup, FormGroupDirective,
  NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, Validator
} from '@angular/forms';

import * as _ from 'lodash';

import { Action } from '../include/include.component';
import { OnExecSuccess, RunService } from '../run.service';


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
export class StageComponent
  implements OnInit, ControlValueAccessor, Validator, OnExecSuccess,
  AfterViewChecked {
  // for staging
  @Input() initialStagedEntities: any[] = [];
  @Output() stagedEntities = new EventEmitter<any[]>();

  @Input() stageHeader: Action | undefined;
  @Input() stageEntity: Action | undefined;
  @Input() showEntity: Action | undefined;

  // Presentation inputs
  @Input() entityName = 'Entity';
  @Input() stageButtonLabel = 'Add';

  stageComponent = this;
  staged: any[] = [];

  entityControl = new FormControl();

  @ViewChild(FormGroupDirective) form;
  stageForm: FormGroup = this.builder.group({
    entityControl: this.entityControl
  });

  constructor(
    private builder: FormBuilder, private elem: ElementRef,
    private rs: RunService, private cdRef: ChangeDetectorRef) { }

  ngOnInit() {
    this.rs.register(this.elem, this);
    this.staged = this.initialStagedEntities;
  }

  ngAfterViewChecked() {
    // https://github.com/angular/angular/issues/14748#issuecomment-307291715
    this.cdRef.detectChanges();
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
    if (value !== undefined && value !== null) {
      this.staged.push(value);
      this.stagedEntities.emit(_.cloneDeep(this.staged));
    }
  }

  unstage(index: number) {
    _.pullAt(this.staged, index);
    this.stagedEntities.emit(_.cloneDeep(this.staged));
  }

  writeValue(value: any[]) {
    if (value) {
      this.staged = value;
    } else {
      this.staged = [];
    }
    this.stagedEntities.emit(_.cloneDeep(this.staged));
  }

  registerOnChange(fn: (value: string) => void) {
    this.stagedEntities.subscribe(fn);
  }

  registerOnTouched() { }

  validate(_c: FormControl): ValidationErrors {
    return {};
  }

  dvOnExecSuccess() {
    this.reset();
  }

  reset() {
    this.staged = [];
    // Can't do `this.form.reset();`
    // See https://github.com/angular/material2/issues/4190
    if (this.form) {
      this.form.resetForm();
    }
  }
}
