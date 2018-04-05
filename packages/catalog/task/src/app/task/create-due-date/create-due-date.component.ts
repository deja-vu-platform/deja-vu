import {
  Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild
} from '@angular/core';
import {
  AbstractControl, ControlValueAccessor, FormBuilder, FormControl,
  FormGroup, FormGroupDirective, NG_VALIDATORS, NG_VALUE_ACCESSOR,
  ValidationErrors, Validator, Validators
} from '@angular/forms';

import {
  GatewayService, GatewayServiceFactory, OnAfterAbort, OnAfterCommit, OnRun,
  RunService
} from 'dv-core';

// https://github.com/dherges/ng-packagr/issues/217
import * as momentImported from 'moment'; const moment = momentImported;
import { startWith } from 'rxjs/operators';


@Component({
  selector: 'task-create-due-date',
  templateUrl: './create-due-date.component.html',
  styleUrls: ['./create-due-date.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: CreateDueDateComponent,
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: CreateDueDateComponent,
      multi: true
    }
  ]
})
export class CreateDueDateComponent
  implements OnInit, ControlValueAccessor, Validator {
  @Input() initialValue;
  @Output() dueDate = new EventEmitter();

  dueDateControl = new FormControl('', [
    Validators.required,
    (control: AbstractControl): {[key: string]: any} => {
      const dueDate = control.value;
      if (!dueDate) {
        return null;
      }
      const now = moment();
      if (now.isAfter(dueDate)) {
        return {
          dueBeforeNow: {
            dueDate: dueDate, now: now
          }
        };
      }

      return null;
    }
  ]);

  constructor(private elem: ElementRef, private rs: RunService) {}

  ngOnInit() {
    this.dueDateControl.setValue(this.initialValue);
    this.dueDateControl.valueChanges.subscribe((newValue) => {
      this.dueDate.emit(newValue);
    });
    this.dueDateControl.valueChanges.pipe(startWith(this.dueDateControl.value));
  }

  writeValue(value: any) {
    if (value) {
      this.dueDateControl.setValue(value);
    } else {
      this.dueDateControl.reset();
    }
  }

  registerOnChange(fn: (value: any) => void) {
    this.dueDate.subscribe(fn);
  }

  registerOnTouched() {}

  validate(c: FormControl): ValidationErrors {
    return this.dueDateControl.validator(this.dueDateControl);
  }
}
