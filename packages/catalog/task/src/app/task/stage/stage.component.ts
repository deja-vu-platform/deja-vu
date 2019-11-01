import {
  Component, ElementRef, EventEmitter, Input, OnInit, Output, Type
} from '@angular/core';
import {
  AbstractControl, ControlValueAccessor, FormBuilder, FormControl,
  FormGroup, FormGroupDirective, NG_VALIDATORS, NG_VALUE_ACCESSOR,
  ValidationErrors, Validator, Validators
} from '@angular/forms';

import { ComponentValue, DvService, DvServiceFactory } from '@deja-vu/core';

import * as _ from 'lodash';

import {
  InputAssigneeComponent
} from '../input-assignee/input-assignee.component';
import {
  ShowAssigneeComponent
} from '../show-assignee/show-assignee.component';


@Component({
  selector: 'task-stage',
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
  ],
  entryComponents: [InputAssigneeComponent, ShowAssigneeComponent]
})
export class StageComponent
  implements OnInit, ControlValueAccessor, Validator {
  @Input() initialStageIds: string[] = [];
  @Output() stagedIds = new EventEmitter<string[]>();

  @Input() inputAssignee: ComponentValue = {
    type: <Type<Component>> InputAssigneeComponent
  };
  @Input() showAssignee: ComponentValue = {
    type: <Type<Component>> ShowAssigneeComponent
  };

  @Input() stageHeader: ComponentValue | undefined;

  assigneeId: string;

  // Presentation inputs
  @Input() buttonLabel = 'Add assignee';

  private dvs: DvService;
  staged: string[] = [];

  stageComponent = this;

  constructor(
    private readonly elem: ElementRef,
    private readonly dvf: DvServiceFactory) {}

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .build();
    this.staged = this.initialStageIds;
  }

  stage(id: string) {
    this.staged.push(id);
    this.stagedIds.emit(this.staged);
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

  registerOnTouched() { }

  validate(c: FormControl): ValidationErrors {
    return null;
  }
}
