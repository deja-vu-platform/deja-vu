import {
  Component, ElementRef, EventEmitter, Input, OnInit, ViewChild
} from '@angular/core';

import {
  AbstractControl, FormBuilder, FormControl, FormGroup, FormGroupDirective,
  Validators
} from '@angular/forms';

import {
  GatewayService, GatewayServiceFactory, OnAfterAbort, OnAfterCommit, OnRun,
  RunService
} from 'dv-core';

import { Observable } from 'rxjs/Observable';
import { map } from 'rxjs/operators';

import { Property } from '../shared/property.model';

import * as _ from 'lodash';


const SAVED_MSG_TIMEOUT = 3000;

@Component({
  selector: 'property-create-object',
  templateUrl: './create-object.component.html',
  styleUrls: ['./create-object.component.css']
})
export class CreateObjectComponent implements OnInit, OnRun, OnAfterCommit {
  @Input() id: string | undefined;

  @Input() buttonLabel = 'Create Object';
  @Input() newObjectSavedText = 'New object saved';

  @ViewChild(FormGroupDirective) form;

  createObjectForm: FormGroup = this.builder.group({});
  properties: Property[];

  newObjectSaved = false;
  newObjectError: string;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, private builder: FormBuilder) {}

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
      .get<{data: {properties: Property[]}}>('/graphql', {
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
      .pipe(map((res) => res.data.properties))
      .subscribe((properties: Property[]) => {
        this.properties = properties;
        const formControls = {};
        for (const property of properties) {
          this[property.name] = new FormControl('');
          formControls[property.name] = this[property.name];
        }
        this.createObjectForm = this.builder.group(formControls);
      });
  }

  onSubmit() {
    this.rs.run(this.elem);
  }

  async dvOnRun(): Promise<void> {
    const input = { id: this.id };
    for (const property of this.properties) {
      input[property.name] = this[property.name].value;
    }
    const res = await this.gs
      .post<{data: any, errors: {message: string}[]}>('/graphql', {
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

  dvOnAfterCommit() {
    this.newObjectSaved = true;
    window.setTimeout(() => {
      this.newObjectSaved = false;
    }, SAVED_MSG_TIMEOUT);
    // Can't do `this.form.reset();`
    // See https://github.com/angular/material2/issues/4190
    if (this.form) {
      this.form.resetForm();
    }
  }

  dvOnAfterAbort(reason: Error) {
    this.newObjectError = reason.message;
  }

}
