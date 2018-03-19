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

import { Good, Party } from "../shared/market.model";


@Component({
  selector: 'market-create-good-seller',
  templateUrl: './create-good-seller.component.html',
  styleUrls: ['./create-good-seller.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: CreateGoodSellerComponent,
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: CreateGoodSellerComponent,
      multi: true
    }
  ]
})
export class CreateGoodSellerComponent
    implements OnInit, ControlValueAccessor, Validator {
  @Input() initialValue: string;
  @Output() sellerId: EventEmitter<string> = new EventEmitter<string>();

  // Presentation input
  @Input() inputLabel: string = 'Seller';

  sellerIdControl = new FormControl(this.initialValue, [Validators.required]);

  constructor(private elem: ElementRef, private rs: RunService) {}

  ngOnInit() {
    this.sellerIdControl.valueChanges.subscribe((newValue: string) => {
      this.sellerId.emit(newValue);
    });
    this.sellerIdControl.valueChanges.pipe(startWith(this.sellerIdControl.value));
    // set initial value after subscribing to changes so that it will be emitted
    this.sellerIdControl.setValue(this.initialValue);
  }

  writeValue(value: any) {
    if (value) {
      this.sellerIdControl.setValue(value);
    } else {
      this.sellerIdControl.reset();
    }
  }

  registerOnChange(fn: (value: any) => void) {
    this.sellerId.subscribe(fn);
  }

  registerOnTouched() {}

  validate(c: FormControl): ValidationErrors {
    return this.sellerIdControl.validator(this.sellerIdControl);
  }
}
