import {
  Component, ElementRef, EventEmitter, Input, OnInit, Output, Type,
  ViewChild
} from '@angular/core';
import {
  AbstractControl, ControlValueAccessor, FormBuilder, FormControl,
  FormGroup, FormGroupDirective, NG_VALIDATORS, NG_VALUE_ACCESSOR,
  ValidationErrors, Validator, Validators
} from '@angular/forms';


import {
  Action, GatewayService, GatewayServiceFactory, OnAfterAbort,
  OnAfterCommit, OnRun, RunService
} from 'dv-core';

import * as _ from 'lodash';

import { ShowGroupComponent } from '../show-group/show-group.component';
import { ShowMemberComponent } from '../show-member/show-member.component';


@Component({
  selector: 'group-stage',
  templateUrl: './stage.component.html',
  styleUrls: ['./stage.component.css'],
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
implements OnInit, ControlValueAccessor, Validator {
  @Input() type: 'member' | 'group' = 'member';
  @Input() initialStageIds: string[] = [];
  @Output() stagedIds = new EventEmitter<string[]>();

  @Input() showMember: Action = {
    type: <Type<Component>> ShowMemberComponent
  };

  @Input() showGroup: Action = {
    type: <Type<Component>> ShowGroupComponent
  };

  // Presentation inputs
  @Input() autocompletePlaceholder;
  @Input() buttonLabel;

  @ViewChild(FormGroupDirective) form;

  autocomplete = new FormControl('');
  stageForm: FormGroup = this.builder.group({
    autocomplete: this.autocomplete
  });

  private gs: GatewayService;
  staged: string[] = [];

  stageComponent = this;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, private builder: FormBuilder) {}

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
    if (!this.autocompletePlaceholder) {
      this.autocompletePlaceholder = `Choose ${this.type}`;
    }
    if (!this.buttonLabel) {
      this.buttonLabel = `Add ${this.type}`;
    }
    this.staged = this.initialStageIds;
  }

  stage() {
    this.staged.push(this.autocomplete.value);
    this.stagedIds.emit(this.staged);
    if (this.form) {
      this.form.resetForm();
    }
  }

  unstage(id: string) {
    _.pull(this.staged, id);
    this.stagedIds.emit(this.staged);
  }

  writeValue(value: string[]) {
    if (value) {
      this.staged = value;
    } else {
      this.staged = [];
    }
    this.stagedIds.emit(this.staged);
  }

  registerOnChange(fn: (value: string) => void) {
    this.stagedIds.subscribe(fn);
  }

  registerOnTouched() {}

  validate(c: FormControl): ValidationErrors {
    return null;
  }
}
