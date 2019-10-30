import {
  Component, ElementRef, EventEmitter, Inject, Input, OnInit, Output, ViewChild
} from '@angular/core';

import {
  AbstractControl, FormBuilder, FormControl,
  FormGroup, FormGroupDirective,
  Validators
} from '@angular/forms';

import {
  DvService, DvServiceFactory, OnExec, OnExecFailure, OnExecSuccess
} from '@deja-vu/core';

import { getPropertiesFromConfig, Property } from '../shared/property.model';

import * as _ from 'lodash';

import { API_PATH } from '../property.config';


export interface ValueMap {
  [property: string]: any;
}


const SAVED_MSG_TIMEOUT = 3000;

/**
 * Edit an object, which has one or more properties.
 *
 */
@Component({
  selector: 'property-update-object',
  templateUrl: './update-object.component.html',
  styleUrls: ['./update-object.component.css']
})
export class UpdateObjectComponent
  implements OnInit, OnExec, OnExecSuccess, OnExecFailure {
  /**
   * The ID of the object to update. If `id` is given and there's no `useObject`
   * input, then this component will use `show-object` to fetch the object
   * of the given id and populate the update form. If no `id` and no `useObject`
   * is given, a random ID is generated to create a new object.
   *
   * Note: using `id` will do an unprotected show-object.
   */
  @Input() id: string | undefined;

  @Input()
  set useObject(v: any | undefined) {
    if (v !== undefined) {
      this._useObject = v;
      this.setInitialValues(v);
    }
  }
  _useObject;

  /**
   * The preset initialValues that overwrites
   * the return value from `show-object` or the values from `object`
   */
  @Input() initialValue: ValueMap = {};

  /**
   * List of property names to not show input fields for
   */
  @Input() showExclude: string[] = [];
  /**
   * Text for the button to update the object
   */
  @Input() buttonLabel = 'Update Object';
  /**
   * Text to show when an object is successfully created
   */
  @Input() updateObjectSavedText = 'Successfully updated object';
  /**
   * Whether or not the create object button should be shown
   */
  @Input() showOptionToSubmit = true;

  /**
   * If set to true, the output "objectOnDisplay"
   * will emit the current displayed object onChange
   */
  @Input() emitOnChange = false;
  /**
   * The updated object
   */
  @Output() object = new EventEmitter<any>();

  /**
   * Used for internal purpose to pass in the config from parents
   */
  @Input() _config;

  /**
   * Updates on change
   * Used to let its parent object get the information
   * of what is on display
   */
  @Output() objectOnDisplay = new EventEmitter<any>();

  @ViewChild(FormGroupDirective) form;

  updateObjectForm: FormGroup = this.builder.group({});
  properties: Property[];

  objectUpdated = false;
  updateObjectError: string;
  formInitialized = false;
  savedInitialValue;

  config;
  private dvs: DvService;

  constructor(
    private elem: ElementRef, private dvf: DvServiceFactory,
    private builder: FormBuilder, @Inject(API_PATH) private apiPath) {}

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .build();

    this.config = this._config ? this._config : this.dvs.config.getConfig();
    this.properties = getPropertiesFromConfig(this.config);
    const formControls = {};
    for (const property of this.properties) {
      this[property.name] = new FormControl();
      formControls[property.name] = this[property.name];
    }
    this.updateObjectForm = this.builder.group(formControls);
    if (this.emitOnChange) {
      this.updateObjectForm.valueChanges.subscribe(
        () => {
          const input = { id: this.getId() };
          for (const property of this.properties) {
            input[property.name] = this[property.name].value;
          }
          this.objectOnDisplay.emit(input);
        }
      );
    }

    this.formInitialized = true;
    if (!_.isEmpty(this.savedInitialValue)) {
      this.setInitialValues(this.savedInitialValue);
    }
  }

  onSubmit() {
    this.dvs.exec();
  }

  async dvOnExec(): Promise<void> {
    const input = { id: this.getId() };
    for (const property of this.properties) {
      input[property.name] = this[property.name].value;
    }

    const res = await this.dvs
      .post<{ data: any, errors: { message: string }[] }>(this.apiPath, {
        inputs: { input: input },
        extraInfo: {
          action: 'update',
          returnFields: ''
        }
      });
    if (res.errors) {
      throw new Error(_.map(res.errors, 'message')
        .join());
    }

    this.object.emit(input);
  }

  dvOnExecSuccess() {
    if (this.showOptionToSubmit) {
      this.updateObjectError = '';
      this.objectUpdated = true;
      window.setTimeout(() => {
        this.objectUpdated = false;
      }, SAVED_MSG_TIMEOUT);
    }
  }

  dvOnExecFailure(reason: Error) {
    if (this.showOptionToSubmit) {
      this.updateObjectError = reason.message;
    }
  }

  setInitialValues(value) {
    if (!this.formInitialized) {
      this.savedInitialValue = value;
    } else {
      if (!_.isEmpty(value)) {
        this.updateObjectForm.patchValue(value);
      }

      if (!_.isEmpty(this.initialValue)) {
        this.updateObjectForm.patchValue(this.initialValue);
      }
    }
  }

  private getId() {
    return (this._useObject !== undefined) ? this._useObject.id : this.id;
  }
}
