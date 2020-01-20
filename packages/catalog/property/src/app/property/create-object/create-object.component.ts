import {
  Component, ElementRef, EventEmitter, Inject, Input, OnInit, Output, ViewChild
} from '@angular/core';

import {
  AbstractControl, FormBuilder, FormControl, FormGroup, FormGroupDirective,
  Validators
} from '@angular/forms';

import {
  DvService, DvServiceFactory, OnExec, OnExecFailure, OnExecSuccess
} from '@deja-vu/core';

import {
  getObjectTitleFromConfig, getPropertiesFromConfig, Property
} from '../shared/property.model';

import * as _ from 'lodash';

import { API_PATH } from '../property.config';


export interface ValueMap {
  [property: string]: any;
}


const SAVED_MSG_TIMEOUT = 3000;

/**
 * Create an object, which has one or more properties
 */
@Component({
  selector: 'property-create-object',
  templateUrl: './create-object.component.html',
  styleUrls: ['./create-object.component.css']
})
export class CreateObjectComponent
  implements OnInit, OnExec, OnExecSuccess, OnExecFailure {
  /**
   * The ID which should be used by the created object.
   * If not given, a random ID is generated.
   */
  @Input() id: string | undefined;
  savedInitialValue: ValueMap;
  /**
   * (Optional) default values to populate each property input with
   */
  @Input() set initialValue(value: ValueMap) {
    for (const fieldName of _.keys(value)) {
      if (this[fieldName]) {
        this[fieldName].setValue(value[fieldName]);
      }
    }
    this.savedInitialValue = value;
  }
  /**
   * List of property names to not show input fields for
   */
  @Input() showExclude: string[] = [];
  /**
   * Text for the button to create an object
   */
  @Input() buttonLabel;
  /**
   * Text to show when an object is successfully created
   */
  @Input() newObjectSavedText;
  /**
   * Whether or not the create object button should be shown
   */
  @Input() showOptionToSubmit = true;
  /**
   * Whether or not the created object should be saved to the database
   */
  @Input() save = true;

  @Input() _config;
  /**
   * The created object
   */
  @Output() object = new EventEmitter<any>();

  /**
   * Updates on change
   * Used to let its parent object to get the
   * information of what is on display
   */
  @Output() objectOnDisplay = new EventEmitter<any>();

  @ViewChild(FormGroupDirective) form;

  createObjectForm: FormGroup = this.builder.group({});
  properties: Property[];

  newObjectSaved = false;
  newObjectError: string;

  config;
  private dvs: DvService;

  constructor(
    private readonly elem: ElementRef, private readonly dvf: DvServiceFactory,
    private readonly builder: FormBuilder,
    @Inject(API_PATH) private readonly apiPath) { }

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .build();
    this.config = this._config ? this._config : this.dvs.config.getConfig();

    const objTitle = getObjectTitleFromConfig(this.config);
    if (this.buttonLabel === undefined) {
      this.buttonLabel = `Create ${objTitle}`;
    }
    if (this.newObjectSavedText === undefined) {
      this.newObjectSavedText = `New ${objTitle.toLowerCase()} saved`;
    }
    this.properties = getPropertiesFromConfig(this.config);
    const formControls = {};
    for (const property of this.properties) {
      this[property.name] = new FormControl();
      formControls[property.name] = this[property.name];
    }
    this.createObjectForm = this.builder.group(formControls);
    this.initialValue = this.savedInitialValue;

    this.createObjectForm.valueChanges.subscribe(
      () => {
        const input = { id: this.id };
        for (const property of this.properties) {
          input[property.name] = this[property.name].value;
        }
        this.objectOnDisplay.emit(input);
      }
    );
  }

  onSubmit() {
    this.dvs.exec();
  }

  async dvOnExec(): Promise<void> {
    const input = { id: this.id };
    for (const property of this.properties) {
      input[property.name] = this[property.name].value;
    }

    if (this.save) {
      const res = await this.dvs
        .post<{ data: any, errors: { message: string }[] }>(this.apiPath, {
          inputs: { input: input },
          extraInfo: {
            action: 'create',
            returnFields: 'id'
          }
        });
      if (res.errors) {
        throw new Error(_.map(res.errors, 'message')
          .join());
      }
    } else {
      this.dvs.noRequest();
    }
    this.object.emit(input);
  }

  dvOnExecSuccess() {
    if (this.showOptionToSubmit && this.save) {
      this.newObjectError = '';
      this.newObjectSaved = true;
      window.setTimeout(() => {
        this.newObjectSaved = false;
      }, SAVED_MSG_TIMEOUT);
    }
    // Can't do `this.form.reset();`
    // See https://github.com/angular/material2/issues/4190
    if (this.form) {
      this.reset();
    }
  }

  reset() {
    this.form.resetForm();
    this.setInitialValues();
  }

  dvOnExecFailure(reason: Error) {
    this.setInitialValues();
    if (this.showOptionToSubmit && this.save) {
      this.newObjectError = reason.message;
    }
  }

  setInitialValues() {
    if (this.savedInitialValue) {
      this.createObjectForm.patchValue(this.savedInitialValue);
    }
  }
}
