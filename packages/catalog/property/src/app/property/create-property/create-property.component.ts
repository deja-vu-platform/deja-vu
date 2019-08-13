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
  ConfigService, ConfigServiceFactory, GatewayService,
  GatewayServiceFactory, OnExecSuccess, RunService
} from '@deja-vu/core';

import { map, startWith } from 'rxjs/operators';

import * as Ajv from 'ajv';

import * as _ from 'lodash';

import {
  getProperties, getPropertiesFromConfig, Property
} from '../shared/property.model';

/**
 * Create a single property
 * You probably don't want to use this on its own and instead want Create Object
 */
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
implements OnInit, OnChanges, ControlValueAccessor, Validator,
OnExecSuccess {
  /**
   * The name of the property to create
   * (should match a name in the schama the concept is configured with)
   */
  @Input() name: string;
  /**
   * (Optional) default value to populate the input with
   */
  @Input() initialValue;
  /**
   * The value of the property created
   */
  @Output() value = new EventEmitter();
  /**
   * Used internally by the concept for passing the configuration
   */
  @Input() _config;

  propertyControl: FormControl;
  schemaErrors: string[];
  required = false;
  type;
  enumList = null;

  private gs: GatewayService;
  private cs: ConfigService;
  private schemaValidate;
  private ajv = new Ajv();

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, private csf: ConfigServiceFactory) {}

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
    this.cs = this.csf.createConfigService(this.elem);
    this.loadSchema();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.name) {
      this.loadSchema();
    }
  }

  /**
   * Get the JSON Schema object corresponding to the property being created.
   *
   * This is used for initializing the property form control with the required
   * validators.
   */
  loadSchema() {
    if ((!this.cs && !this._config) || !this.name) {
      return;
    }
    const properties = this._config ?
      getPropertiesFromConfig(this._config) : getProperties(this.cs);
    const property: Property | undefined = _
      .find(properties, ['name', this.name]);
    if (!property) {
      throw new Error(`Property ${this.name} not in schema`);
    }
    const schema = property.schema;
    if (schema.enum) {
      this.enumList = schema.enum;
    }
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
      this.required = true;
      validators.push(Validators.required);
    }
    this.propertyControl = new FormControl('', validators);
    this.propertyControl.setValue(this.initialValue);
    this.propertyControl.valueChanges.subscribe((newValue) => {
      this.value.emit(newValue);
    });
    this.propertyControl.valueChanges
      .pipe(startWith(this.propertyControl.value));
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

  dvOnExecSuccess() {
    this.propertyControl.reset();
  }
}
