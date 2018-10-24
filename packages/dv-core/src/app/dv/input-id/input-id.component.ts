import {
  Component, ElementRef, EventEmitter, Input, OnInit, Output
} from '@angular/core';
import {
  ControlValueAccessor, FormControl, NG_VALIDATORS, NG_VALUE_ACCESSOR,
  ValidationErrors, Validator, Validators
} from '@angular/forms';

import { RunService, OnAfterExecCommit } from '../run.service';


import { startWith } from 'rxjs/operators';

@Component({
  selector: 'dv-input-id',
  templateUrl: './input-id.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: InputIdComponent,
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: InputIdComponent,
      multi: true
    }
  ]
})
export class InputIdComponent
implements OnInit, ControlValueAccessor, Validator, OnAfterExecCommit {
  @Input() entityName = 'Id';
  idControl = new FormControl('', [Validators.required]);
  @Output() id = new EventEmitter<string>();

  constructor(private elem: ElementRef, private rs: RunService) {}

  ngOnInit() {
    this.rs.register(this.elem, this);
    this.idControl.valueChanges.subscribe((value: string) => {
      this.id.emit(value);
    });
    this.idControl.valueChanges.pipe(startWith(
      this.idControl.value));
  }

  writeValue(value: string) {
    if (value === null) {
      this.reset();
    } else {
      this.idControl.setValue(value);
    }
  }

  registerOnChange(fn: (value: string) => void) {
    this.id.subscribe(fn);
  }

  registerOnTouched() {}

  validate(_c: FormControl): ValidationErrors | null {
    return this.idControl.errors;
  }

  dvOnAfterExecCommit() {
    this.reset();
  }

  reset() {
    this.idControl.reset();
    this.idControl.markAsUntouched();
    this.idControl.markAsPristine();
  }
}
