import {
  Component, ElementRef, EventEmitter, Input, OnInit, Output
} from '@angular/core';
import {
  ControlValueAccessor, FormControl, NG_VALIDATORS, NG_VALUE_ACCESSOR,
  ValidationErrors, Validator, Validators
} from '@angular/forms';

import {
  GatewayService, GatewayServiceFactory, RunService
} from 'dv-core';


@Component({
  selector: 'scoring-create-score-value',
  templateUrl: './create-score-value.component.html',
  styleUrls: ['./create-score-value.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: CreateScoreValueComponent,
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: CreateScoreValueComponent,
      multi: true
    }
  ]
})
export class CreateScoreValueComponent
  implements OnInit, ControlValueAccessor, Validator {
  @Input() initialValue: number = 0;
  @Output() value: EventEmitter<number> = new EventEmitter<number>();

  // Presentation input
  @Input() inputLabel: string = 'Score';

  valueControl = new FormControl('', [ Validators.required ]);

  constructor(private elem: ElementRef, private rs: RunService) {}

  ngOnInit() {
    this.valueControl.valueChanges.subscribe((newValue: number) => {
      this.value.emit(newValue);
    });
    // set initial value after subscribing to changes so that it will be emitted
    this.valueControl.setValue(this.initialValue);
  }

  writeValue(value: any) {
    if (value || value === 0) {
      this.valueControl.setValue(value);
    } else {
      this.valueControl.reset();
    }
  }

  registerOnChange(fn: (value: any) => void) {
    this.value.subscribe(fn);
  }

  registerOnTouched() {}

  validate(c: FormControl): ValidationErrors {
    return this.valueControl.validator(this.valueControl);
  }
}
