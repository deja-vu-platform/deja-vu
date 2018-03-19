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
  selector: 'market-create-good-price',
  templateUrl: './create-good-price.component.html',
  styleUrls: ['./create-good-price.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: CreateGoodPriceComponent,
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: CreateGoodPriceComponent,
      multi: true
    }
  ]
})
export class CreateGoodPriceComponent 
  implements OnInit, ControlValueAccessor, Validator {
  @Input() initialValue: number = 0;
  @Output() price: EventEmitter<number> = new EventEmitter<number>();

  // Presentation input
  @Input() inputLabel: string = 'Price';

  priceControl = new FormControl('', [
    Validators.required,
    Validators.pattern('^[0-9]+(\.[0-9]{0,2})?$')
  ]);

  constructor(private elem: ElementRef, private rs: RunService) {}

  ngOnInit() {
    this.priceControl.valueChanges.subscribe((newValue: number) => {
      this.price.emit(newValue);
    });
    this.priceControl.valueChanges.pipe(startWith(this.priceControl.value));
    // set initial value after subscribing to changes so that it will be emitted
    this.priceControl.setValue(this.initialValue);
  }

  writeValue(value: any) {
    if (value || value === 0) {
      this.priceControl.setValue(value);
    } else {
      this.priceControl.reset();
    }
  }

  registerOnChange(fn: (value: any) => void) {
    this.price.subscribe(fn);
  }

  registerOnTouched() {}

  validate(c: FormControl): ValidationErrors {
    return this.priceControl.validator(this.priceControl);
  }
}
