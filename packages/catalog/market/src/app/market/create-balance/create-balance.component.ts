import {
  Component, ElementRef, EventEmitter, Input, OnInit, Output
} from '@angular/core';
import {
  AbstractControl, ControlValueAccessor, FormControl, NG_VALIDATORS,
  NG_VALUE_ACCESSOR, ValidationErrors, Validator, Validators
} from '@angular/forms';

import {
  GatewayService, GatewayServiceFactory, RunService
} from 'dv-core';

import { startWith } from 'rxjs/operators';


@Component({
  selector: 'market-create-balance',
  templateUrl: './create-balance.component.html',
  styleUrls: ['./create-balance.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: CreateBalanceComponent,
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: CreateBalanceComponent,
      multi: true
    }
  ]
})
export class CreateBalanceComponent
  implements OnInit, ControlValueAccessor, Validator {
  @Input() initialValue: number = 0;
  @Output() balance: EventEmitter<number> = new EventEmitter<number>();

  // Presentation input
  @Input() inputLabel: string = 'Balance';

  balanceControl = new FormControl('', [
    Validators.required,
    Validators.pattern('^[0-9]+(\.[0-9]{0,2})?$')
  ]);

  constructor(private elem: ElementRef, private rs: RunService) {}

  ngOnInit() {
    this.balanceControl.valueChanges.subscribe((newValue: number) => {
      this.balance.emit(newValue);
    });
    this.balanceControl.valueChanges.pipe(startWith(this.balanceControl.value));
    // set initial value after subscribing to changes so that it will be emitted
    this.balanceControl.setValue(this.initialValue);
  }

  writeValue(value: any) {
    if (value || value === 0) {
      this.balanceControl.setValue(value);
    } else {
      this.balanceControl.reset();
    }
  }

  registerOnChange(fn: (value: any) => void) {
    this.balance.subscribe(fn);
  }

  registerOnTouched() {}

  validate(c: FormControl): ValidationErrors {
    return this.balanceControl.validator(this.balanceControl);
  }
}
