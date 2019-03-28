import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnInit,
  Output, Type, ViewChild
} from '@angular/core';
import {
  AbstractControl, ControlValueAccessor, FormBuilder, FormControl,
  FormGroup, FormGroupDirective, NG_VALIDATORS, NG_VALUE_ACCESSOR,
  ValidationErrors, Validator, Validators
} from '@angular/forms';

import { OnExecSuccess, RunService } from '@deja-vu/core';


import { startWith } from 'rxjs/operators';

@Component({
  selector: 'task-input-assignee',
  templateUrl: './input-assignee.component.html',
  styleUrls: ['./input-assignee.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: InputAssigneeComponent,
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: InputAssigneeComponent,
      multi: true
    }
  ]
})
export class InputAssigneeComponent
implements OnInit, ControlValueAccessor, Validator, OnExecSuccess {
  assigneeIdControl = new FormControl('', [Validators.required]);
  @Output() assigneeId = new EventEmitter<string>();

  constructor(private elem: ElementRef, private rs: RunService) {}

  ngOnInit() {
    this.rs.register(this.elem, this);
    this.assigneeIdControl.valueChanges.subscribe((value: string) => {
      this.assigneeId.emit(value);
    });
    this.assigneeIdControl.valueChanges.pipe(startWith(
      this.assigneeIdControl.value));
  }

  writeValue(value: string) {
    if (value === null) {
      this.reset();
    } else {
      this.assigneeIdControl.setValue(value);
    }
  }

  registerOnChange(fn: (value: string) => void) {
    this.assigneeId.subscribe(fn);
  }

  registerOnTouched() {}

  validate(c: FormControl): ValidationErrors {
    if (this.assigneeIdControl.pristine) {
      return null;
    }

    return this.assigneeIdControl.errors;
  }


  dvOnExecSuccess() {
    this.reset();
  }

  reset() {
    this.assigneeIdControl.reset();
    this.assigneeIdControl.markAsUntouched();
    this.assigneeIdControl.markAsPristine();
  }
}
