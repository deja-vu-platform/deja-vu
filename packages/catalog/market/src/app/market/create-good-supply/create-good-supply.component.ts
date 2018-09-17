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
  selector: 'market-create-good-supply',
  templateUrl: './create-good-supply.component.html',
  styleUrls: ['./create-good-supply.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: CreateGoodSupplyComponent,
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: CreateGoodSupplyComponent,
      multi: true
    }
  ]
})
export class CreateGoodSupplyComponent
  implements OnInit, ControlValueAccessor, Validator {
  @Input() initialValue = 0;
  @Output() supply: EventEmitter<number> = new EventEmitter<number>();

  // Presentation input
  @Input() inputLabel = 'Supply';

  supplyControl = new FormControl('', [
    Validators.required,
    (control: AbstractControl): {[key: string]: any} => {
      const supply = control.value;
      if (!supply) {
        return null;
      }
      if (supply < 0) {
        return {
          nonnegative: {
            supply: supply
          }
        };
      }

      return null;
    }
  ]);

  constructor(private elem: ElementRef, private rs: RunService) {}

  ngOnInit() {
    this.supplyControl.valueChanges.subscribe((newValue: number) => {
      this.supply.emit(newValue);
    });
    // set initial value after subscribing to changes so that it will be emitted
    this.supplyControl.setValue(this.initialValue);
  }

  writeValue(value: any) {
    if (value || value === 0) {
      this.supplyControl.setValue(value);
    } else {
      this.supplyControl.reset();
    }
  }

  registerOnChange(fn: (value: any) => void) {
    this.supply.subscribe(fn);
  }

  registerOnTouched() {}

  validate(c: FormControl): ValidationErrors {
    return this.supplyControl.validator(this.supplyControl);
  }
}
