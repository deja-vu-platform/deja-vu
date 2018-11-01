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
  OnExecAbort,
  OnExecCommit,
  OnExec,
  RunService
} from 'dv-core';

import { Observable } from 'rxjs/Observable';
import { map } from 'rxjs/operators';

import { PropertiesRes, Property } from '../shared/property.model';

import * as _ from 'lodash';

import { API_PATH } from '../property.config';


export interface ValueMap {
  [property: string]: any;
}


const SAVED_MSG_TIMEOUT = 3000;

@Component({
  selector: 'property-create-object',
  templateUrl: './create-object.component.html',
  styleUrls: ['./create-object.component.css']
})
export class CreateObjectComponent
implements OnInit, OnExec, OnExecCommit, OnExecAbort {
  @Input() id: string | undefined;
  savedInitialValue: ValueMap;
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

  @Input() buttonLabel = 'Create Object';
  @Input() newObjectSavedText = 'New object saved';
  @Input() showOptionToSubmit = true;
  @Input() save = true;
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
    @Inject(API_PATH) private apiPath) {}

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
          query: `
            query {
              properties {
                name
              }
            }
          `
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
        .post<{data: any, errors: {message: string}[]}>(this.apiPath, {
          query: `mutation CreateObject($input: CreateObjectInput!) {
            createObject(input: $input) {
              id
            }
          }`,
          variables: {
            input: input
          }
        })
        .toPromise();
      if (res.errors) {
        throw new Error(_.map(res.errors, 'message')
          .join());
      }
    }
    this.object.emit(input);
  }

  dvOnExecCommit() {
    if (this.showOptionToSubmit && this.save) {
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

  dvOnExecAbort(reason: Error) {
    if (this.showOptionToSubmit && this.save) {
      this.newObjectError = reason.message;
    }
  }
}
