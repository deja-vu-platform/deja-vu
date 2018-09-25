import {
  Component, ElementRef, EventEmitter, Inject, Input, OnInit, Output
} from '@angular/core';
import {
  ControlValueAccessor, FormControl, NG_VALIDATORS, NG_VALUE_ACCESSOR,
  ValidationErrors, Validator, Validators
} from '@angular/forms';

import { OnAfterCommit, RunService } from 'dv-core';

import { startWith } from 'rxjs/operators';
import { CONFIG } from '../transfer.config';

@Component({
  selector: 'transfer-input-amount',
  templateUrl: './input-amount.component.html',
  styleUrls: ['./input-amount.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: InputAmountComponent,
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: InputAmountComponent,
      multi: true
    }
  ]
})
export class InputAmountComponent
  implements OnInit, ControlValueAccessor, Validator, OnAfterCommit {
  amountControl = new FormControl(0, [Validators.required]);
  @Output() amount = new EventEmitter<any>();

  balanceType: 'money' | 'items';

  // Presentation inputs
  @Input() inputPlaceholder: string | undefined;

  constructor(
    private elem: ElementRef, private rs: RunService, @Inject(CONFIG) config) {
    this.balanceType = config.balanceType;
  }

  ngOnInit() {
    this.rs.register(this.elem, this);
    this.amountControl.valueChanges.subscribe((value: number) => {
      this.amount.emit(value);
    });
    this.amountControl.valueChanges.pipe(startWith(
      this.amountControl.value));
  }

  writeValue(value: number) {
    if (value === null) {
      this.reset();
    } else {
      this.amountControl.setValue(value);
    }
  }

  registerOnChange(fn: (value: number) => void) {
    this.amount.subscribe(fn);
  }

  registerOnTouched() {}

  validate(c: FormControl): ValidationErrors {
    if (this.amountControl.pristine) {
      return null;
    }

    return this.amountControl.errors;
  }

  dvOnAfterCommit() {
    this.reset();
  }

  reset() {
    this.amountControl.reset();
    this.amountControl.markAsUntouched();
    this.amountControl.markAsPristine();
  }
}
