import {
  Component, ElementRef, EventEmitter, Inject, Input, OnInit, Output, ViewChild
} from '@angular/core';

import {
  AbstractControl, FormBuilder, FormControl,
  FormGroup, FormGroupDirective,
  Validators
} from '@angular/forms';

import {
  ConfigServiceFactory,
  GatewayService,
  GatewayServiceFactory,
  OnExec,
  OnExecFailure,
  OnExecSuccess,
  RunService
} from '@deja-vu/core';

import { getProperties, Property } from '../shared/property.model';

import * as _ from 'lodash';

import { API_PATH } from '../property.config';


export interface ValueMap {
  [property: string]: any;
}


const SAVED_MSG_TIMEOUT = 3000;

/**
 * Edit an object, which has one or more properties
 */
@Component({
  selector: 'property-update-object',
  templateUrl: './update-object.component.html',
  styleUrls: ['./update-object.component.css']
})
export class UpdateObjectComponent
  implements OnInit, OnExec, OnExecSuccess, OnExecFailure {
  /**
   * The ID which should be used by the created object.
   * If not given, a random ID is generated.
   */
  @Input() id: string ;
  savedInitialValue: ValueMap;

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
   * The updated object
   */
  @Output() object = new EventEmitter<any>();

  @ViewChild(FormGroupDirective) form;

  updateObjectForm: FormGroup = this.builder.group({});
  properties: Property[];
  initialValue;

  objectUpdated = false;
  updateObjectError: string;
  formInitialized = false;

  config;
  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, private csf: ConfigServiceFactory,
    private builder: FormBuilder,
    @Inject(API_PATH) private apiPath) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);

    const cs = this.csf.createConfigService(this.elem);
    this.config = cs.getConfig();
    this.properties = getProperties(cs);
    const formControls = {};
    for (const property of this.properties) {
      this[property.name] = new FormControl('');
      formControls[property.name] = this[property.name];
    }
    this.updateObjectForm = this.builder.group(formControls);
    this.formInitialized = true;
    this.initialValue = this.savedInitialValue;
  }

  onSubmit() {
    this.rs.exec(this.elem);
  }

  async dvOnExec(): Promise<void> {
    const input = { id: this.id };
    for (const property of this.properties) {
      input[property.name] = this[property.name].value;
    }

    const res = await this.gs
      .post<{ data: any, errors: { message: string }[] }>(this.apiPath, {
        inputs: { input: input },
        extraInfo: {
          action: 'update',
          returnFields: 'id'
        }
      })
      .toPromise();
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
    // Can't do `this.form.reset();`
    // See https://github.com/angular/material2/issues/4190
    if (this.form) {
      this.form.resetForm();
    }
  }

  dvOnExecFailure(reason: Error) {
    if (this.showOptionToSubmit) {
      this.updateObjectError = reason.message;
    }
  }
}
