import {
  Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output,
  Pipe, PipeTransform, SimpleChanges, ViewChild
} from '@angular/core';
import {
  AbstractControl, ControlValueAccessor, FormBuilder, FormControl,
  FormGroup, FormGroupDirective, NG_VALIDATORS, NG_VALUE_ACCESSOR,
  ValidationErrors, Validator, Validators
} from '@angular/forms';

import {
  GatewayService, GatewayServiceFactory
} from 'dv-core';

import { Property } from '../shared/property.model';

import { map, startWith } from 'rxjs/operators';

import * as Ajv from 'ajv';

import * as _ from 'lodash';


@Pipe({ name: 'camelToTitleCase'})
export class CamelToTitleCasePipe implements PipeTransform {
  transform(camelCase: string): string {
    return _.startCase(_.camelCase(camelCase));
  }
}

@Component({
  selector: 'property-create-property',
  templateUrl: './create-property.component.html',
  styleUrls: ['./create-property.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: CreatePropertyComponent,
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: CreatePropertyComponent,
      multi: true
    }
  ]
})
export class CreatePropertyComponent
implements OnInit, OnChanges, ControlValueAccessor, Validator {
  @Input() name: string;
  @Input() initialValue;

  @Output() value = new EventEmitter();

  propertyControl: FormControl;
  schemaErrors: string[];
  type;

  private gs: GatewayService;
  private schemaValidate;
  private ajv = new Ajv();

  constructor(private elem: ElementRef, private gsf: GatewayServiceFactory) {}

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.loadSchema();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.name) {
      this.loadSchema();
    }
  }

  loadSchema() {
    if (!this.gs || !this.name) {
      return;
    }
    this.gs
      .get<{data: { property: Property}}>('/graphql', {
        params: {
          query: `
            query {
              property(name: "${this.name}") {
                schema
                required
              }
            }
          `
        }
      })
      .pipe(map((res) => res.data.property))
      .subscribe((property: Property) => {
        const schema = JSON.parse(property.schema);
        this.schemaValidate = this.ajv.compile(schema);
        if (schema.type === 'integer' ||
            schema.type === 'number') {
          this.type = Number;
        } else if (schema.type === 'string') {
          this.type = String;
        } else {
          this.type = Boolean;
        }
        const validators = [this.schemaValidator.bind(this)];
        if (property.required) {
          validators.push(Validators.required);
        }
        this.propertyControl = new FormControl('', validators);
        this.propertyControl.setValue(this.initialValue);
        this.propertyControl.valueChanges.subscribe((newValue) => {
          this.value.emit(newValue);
        });
        this.propertyControl.valueChanges
          .pipe(startWith(this.propertyControl.value));
      });
  }

  schemaValidator(control: AbstractControl): {[key: string]: any} {
    if (!this.schemaValidate || !control.value) {
      return null;
    }
    const valid = this.schemaValidate(this.type(control.value));
    if (!valid) {
      this.schemaErrors = _
        .map(this.schemaValidate.errors, (error) => error.message);

      return {
        schema: true
      };
    }

    return null;
  }

  writeValue(value: any) {
    if (!this.propertyControl) {
      return;
    }
    if (value) {
      this.propertyControl.setValue(value);
    } else {
      this.propertyControl.reset();
    }
  }

  registerOnChange(fn: (value: any) => void) {
    this.value.subscribe(fn);
  }

  registerOnTouched() {}

  validate(c: FormControl): ValidationErrors {
    if (!this.propertyControl) {
      return null;
    }

    return this.propertyControl.validator(this.propertyControl);
  }
}
