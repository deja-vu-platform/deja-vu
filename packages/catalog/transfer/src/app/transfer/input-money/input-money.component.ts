import {
  Component, ElementRef, EventEmitter, Input, OnInit, Output
} from '@angular/core';
import {
  ControlValueAccessor, FormControl, NG_VALIDATORS, NG_VALUE_ACCESSOR,
  ValidationErrors, Validator, Validators
} from '@angular/forms';

import { OnExecCommit, RunService } from 'dv-core';

import { startWith } from 'rxjs/operators';

import * as _ from 'lodash';


@Component({
  selector: 'transfer-input-money',
  templateUrl: './input-money.component.html',
  styleUrls: ['./input-money.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: InputMoneyComponent,
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: InputMoneyComponent,
      multi: true
    }
  ]
})
export class InputMoneyComponent
  implements OnInit, ControlValueAccessor, Validator, OnExecCommit {
  moneyControl = new FormControl(0, [Validators.required]);
  @Output() money = new EventEmitter<number>();

  // Presentation inputs
  @Input() moneyInputPlaceholder;
  moneyInputLabel = _.isEmpty(this.moneyInputPlaceholder) ?
    'Amount' : this.moneyInputPlaceholder;

  constructor(private elem: ElementRef, private rs: RunService) {}

  ngOnInit() {
    this.rs.register(this.elem, this);
    this.moneyControl.valueChanges.subscribe((value: number) => {
      this.money.emit(value);
    });
    this.moneyControl.valueChanges.pipe(startWith(
      this.moneyControl.value));
  }

  writeValue(value: number) {
    if (value === null) {
      this.reset();
    } else {
      this.moneyControl.setValue(value);
    }
  }

  registerOnChange(fn: (value: number) => void) {
    this.money.subscribe(fn);
  }

  registerOnTouched() {}

  validate(c: FormControl): ValidationErrors {
    if (this.moneyControl.pristine) {
      return null;
    }

    return this.moneyControl.errors;
  }

  dvOnExecCommit() {
    this.reset();
  }

  reset() {
    this.moneyControl.reset();
    this.moneyControl.markAsUntouched();
    this.moneyControl.markAsPristine();
  }
}
