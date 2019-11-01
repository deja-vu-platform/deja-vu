/* tslint:disable max-line-length */
/**
 * Copied from Stack Overflow, answerer smnbbrv
 * @see https://stackoverflow.com/questions/49296051/angular-5-angular-material-checkbox-with-3-states-checked-unchecked-indeterm
 */
/* tslint:enable max-line-length */

import { Component, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MAT_CHECKBOX_CLICK_ACTION } from '@angular/material';

@Component({
  selector: 'property-tri-state-checkbox',
  templateUrl: './tri-state-checkbox.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TriStateCheckboxComponent),
      multi: true
    },
    { provide: MAT_CHECKBOX_CLICK_ACTION, useValue: 'noop' }
  ]
})
export class TriStateCheckboxComponent implements ControlValueAccessor {
  tape = [undefined, true, false];

  value: boolean;

  disabled: boolean;

  private onChange: (val: boolean) => void;
  private onTouched: () => void;

  writeValue(value: boolean) {
    this.value = value;
  }

  setDisabledState(disabled: boolean) {
    this.disabled = disabled;
  }

  next() {
    this.value = this.tape[
      (this.tape.indexOf(this.value) + 1) % this.tape.length
    ];
    this.onChange(this.value);
    this.onTouched();
  }

  registerOnChange(fn: any) {
    this.onChange = fn;
  }

  registerOnTouched(fn: any) {
    this.onTouched = fn;
  }
}
