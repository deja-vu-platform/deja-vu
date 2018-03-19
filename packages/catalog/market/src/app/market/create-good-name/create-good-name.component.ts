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
  selector: 'market-create-good-name',
  templateUrl: './create-good-name.component.html',
  styleUrls: ['./create-good-name.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: CreateGoodNameComponent,
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: CreateGoodNameComponent,
      multi: true
    }
  ]
})
export class CreateGoodNameComponent
    implements OnInit, ControlValueAccessor, Validator {
  @Input() initialValue: string;
  @Output() name: EventEmitter<string> = new EventEmitter<string>();

  // Presentation input
  @Input() inputLabel: string = 'Name';

  nameControl = new FormControl(this.initialValue, [Validators.required]);

  constructor(private elem: ElementRef, private rs: RunService) {}

  ngOnInit() {
    this.nameControl.valueChanges.subscribe((newValue: string) => {
      this.name.emit(newValue);
    });
    this.nameControl.valueChanges.pipe(startWith(this.nameControl.value));
    // set initial value after subscribing to changes so that it will be emitted
    this.nameControl.setValue(this.initialValue);
  }

  writeValue(value: any) {
    if (value) {
      this.nameControl.setValue(value);
    } else {
      this.nameControl.reset();
    }
  }

  registerOnChange(fn: (value: any) => void) {
    this.name.subscribe(fn);
  }

  registerOnTouched() {}

  validate(c: FormControl): ValidationErrors {
    return this.nameControl.validator(this.nameControl);
  }
}
