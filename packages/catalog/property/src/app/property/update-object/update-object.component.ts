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

import { getPropertiesFromConfig, Property } from '../shared/property.model';

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
  @Input() id: string;

  /**
   * The preset initialValues that overwrites
   * the return value from showObject
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
    this.config = this._config ? this._config : cs.getConfig();
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
          const input = { id: this.id };
          for (const property of this.properties) {
            input[property.name] = this[property.name].value;
          }
          this.objectOnDisplay.emit(input);
        }
      );
    }

    this.formInitialized = true;
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
          returnFields: ''
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
  }

  dvOnExecFailure(reason: Error) {
    if (this.showOptionToSubmit) {
      this.updateObjectError = reason.message;
    }
  }

  setInitialValues(value) {
    if (value) {
      this.updateObjectForm.patchValue(value);
    }

    if (this.initialValue) {
      this.updateObjectForm.patchValue(this.initialValue);
    }
  }
}
