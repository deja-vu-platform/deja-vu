import {
  Component, ElementRef, EventEmitter, Inject, Input, OnInit, Output, ViewChild
} from '@angular/core';

import {
  AbstractControl, FormBuilder, FormControl, FormGroup, FormGroupDirective,
  Validators
} from '@angular/forms';

import {
  GatewayService,
  GatewayServiceFactory,
  OnExecFailure,
  OnExecSuccess,
  OnExec,
  RunService
} from '@deja-vu/core';

import { Observable } from 'rxjs/Observable';
import { map } from 'rxjs/operators';

import { PropertiesRes, Property } from '../shared/property.model';

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
    if (!this.formInitialized) {
      this.savedInitialValue = value;

      return;
    }
    for (const fieldName of _.keys(value)) {
      if (this[fieldName]) {
        this[fieldName].setValue(value[fieldName]);
      }
    }
  }
  /**
   * List of property names to not show input fields for
   */
  @Input() showExclude: string[] = [];
  /**
   * Text for the button to create an object
   */
  @Input() buttonLabel = 'Create Object';
  /**
   * Text to show when an object is successfully created
   */
  @Input() newObjectSavedText = 'New object saved';
  /**
   * Whether or not the create object button should be shown
   */
  @Input() showOptionToSubmit = true;
  /**
   * Whether or not the created object should be saved to the database
   */
  @Input() save = true;
  /**
   * The created object
   */
  @Output() object = new EventEmitter<any>();

  @ViewChild(FormGroupDirective) form;

  createObjectForm: FormGroup = this.builder.group({});
  properties: Property[];

  newObjectSaved = false;
  newObjectError: string;
  formInitialized = false;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, private builder: FormBuilder,
    @Inject(API_PATH) private apiPath) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
    this.loadSchema();
  }

  loadSchema() {
    if (!this.gs) {
      return;
    }
    this.gs
      .get<PropertiesRes>(this.apiPath, {
        params: {
          extraInfo: {
            action: 'schema',
            returnFields: 'name'
          }
        }
      })
      .pipe(map((res: PropertiesRes) => res.data.properties))
      .subscribe((properties: Property[]) => {
        this.properties = properties;
        const formControls = {};
        for (const property of properties) {
          this[property.name] = new FormControl('');
          formControls[property.name] = this[property.name];
        }
        this.createObjectForm = this.builder.group(formControls);
        this.formInitialized = true;
        this.initialValue = this.savedInitialValue;
      });
  }

  onSubmit() {
    this.rs.exec(this.elem);
  }

  async dvOnExec(): Promise<void> {
    const input = { id: this.id };
    for (const property of this.properties) {
      input[property.name] = this[property.name].value;
    }

    if (this.save) {
      const res = await this.gs
        .post<{ data: any, errors: { message: string }[] }>(this.apiPath, {
          inputs: { input: input },
          extraInfo: {
            action: 'create',
            returnFields: 'id'
          }
        })
        .toPromise();
      if (res.errors) {
        throw new Error(_.map(res.errors, 'message')
          .join());
      }
    } else {
      this.gs.noRequest();
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
      this.form.resetForm();
    }
  }

  dvOnExecFailure(reason: Error) {
    if (this.showOptionToSubmit && this.save) {
      this.newObjectError = reason.message;
    }
  }
}
