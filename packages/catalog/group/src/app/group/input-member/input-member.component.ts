import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnInit,
  Output, Type, ViewChild
} from '@angular/core';
import {
  AbstractControl, ControlValueAccessor, FormBuilder, FormControl,
  FormGroup, FormGroupDirective, NG_VALIDATORS, NG_VALUE_ACCESSOR,
  ValidationErrors, Validator, Validators
} from '@angular/forms';

import { OnExecSuccess, RunService } from '@dejavu-lang/core';


import { startWith } from 'rxjs/operators';

@Component({
  selector: 'group-input-member',
  templateUrl: './input-member.component.html',
  styleUrls: ['./input-member.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: InputMemberComponent,
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: InputMemberComponent,
      multi: true
    }
  ]
})
export class InputMemberComponent
implements OnInit, ControlValueAccessor, Validator, OnExecSuccess {
  memberIdControl = new FormControl('', [Validators.required]);
  @Output() memberId = new EventEmitter<string>();

  constructor(private elem: ElementRef, private rs: RunService) {}

  ngOnInit() {
    this.rs.register(this.elem, this);
    this.memberIdControl.valueChanges.subscribe((value: string) => {
      this.memberId.emit(value);
    });
    this.memberIdControl.valueChanges.pipe(startWith(
      this.memberIdControl.value));
  }

  writeValue(value: string) {
    if (value === null) {
      this.reset();
    } else {
      this.memberIdControl.setValue(value);
    }
  }

  registerOnChange(fn: (value: string) => void) {
    this.memberId.subscribe(fn);
  }

  registerOnTouched() {}

  validate(c: FormControl): ValidationErrors {
    if (this.memberIdControl.pristine) {
      return null;
    }

    return this.memberIdControl.errors;
  }


  dvOnExecSuccess() {
    this.reset();
  }

  reset() {
    this.memberIdControl.reset();
    this.memberIdControl.markAsUntouched();
    this.memberIdControl.markAsPristine();
  }
}
