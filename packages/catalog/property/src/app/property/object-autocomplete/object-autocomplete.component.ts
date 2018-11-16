import {
  Component, ElementRef, EventEmitter, Inject, Input, OnInit, Output, Type,
  ViewChild
} from '@angular/core';
import {
  AbstractControl, ControlValueAccessor, FormBuilder, FormControl,
  FormGroup, FormGroupDirective, NG_VALIDATORS, NG_VALUE_ACCESSOR,
  ValidationErrors, Validator, Validators
} from '@angular/forms';

import { MatAutocompleteSelectedEvent } from '@angular/material';

import {Observable} from 'rxjs/Observable';
import { map } from 'rxjs/operators/map';
import { startWith } from 'rxjs/operators/startWith';

import * as _ from 'lodash';

import {
  Action, GatewayService, GatewayServiceFactory, RunService
} from 'dv-core';

import { properties, Property } from '../shared/property.model';

import { ShowObjectComponent } from '../show-object/show-object.component';

import { API_PATH } from '../property.config';


@Component({
  selector: 'property-object-autocomplete',
  templateUrl: './object-autocomplete.component.html',
  styleUrls: ['./object-autocomplete.component.css']
})
export class ObjectAutocompleteComponent
implements OnInit, ControlValueAccessor, Validator {
  @Input() objectAutocompletePlaceholder = 'Choose One';
  @Input() required = true;
  @Input() requiredErrorMsg = `
    This field is <strong>required</strong>
  `;
  @Input() notAnOptionErrorMsgFn = ((selectedId) => `
    ${selectedId} is not a valid option
  `);
  @Input() disabledIds: string[] = [];

  @Input() showObject: Action = {
    type: <Type<Component>> ShowObjectComponent
  };
  @Input() showOnly: string[];
  @Input() showExclude: string[];
  @Input() showBaseUrlsOnly: boolean = false;
  @Output() objects = new EventEmitter<Object[]>();
  _objects: Object[] = [];

  @Input() set initialObjectId(id: string) {
    this._selectedObjectId = id;
    this.selectedObjectId.emit(id);
  }
  @Output() selectedObjectId = new EventEmitter<string>();

  _selectedObjectId;
  control: FormControl = new FormControl('', [
    (c: AbstractControl): ValidationErrors => {
      if (c.pristine) {
        return null;
      }
      const selectedId = c.value;
      if (this.required && !selectedId) {
        return {required: selectedId};
      }
      if (!_.includes(this.ids, selectedId)) {
        return {notAnOption: selectedId};
      }

      return null;
    }
  ]);

  ids: string[] = [];
  filteredObjects: Observable<Object[]>;
  objectAutocomplete = this;

  errors: any;

  private properties: string[];
  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService,
    @Inject(API_PATH) private apiPath) {}

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
    this.load();
  }

  async load() {
    if (!this.gs) {
      return;
    }
    if (!this.properties) {
      this.properties = properties(
        this.showOnly, this.showExclude, await this.fetchProperties());
    }
    this.fetchObjects();
  }

  async fetchProperties(): Promise<string[]> {
    const res = await this.gs
      .get<{data: {properties: Property[]}}>(this.apiPath, {
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
      .toPromise();

    return _.map(res.data.properties, 'name');
  }

  fetchObjects() {
    if (this.gs) {
      this.gs
        .get<{data: {objects: Object[]}}>(this.apiPath, {
          params: {
            query: `
              query {
                objects {
                  id
                  ${this.properties.join('\n')}
                }
              }
            `
          }
        })
        .subscribe((res) => {
          this._objects = res.data.objects;
          this.objects.emit(this._objects);
          this.ids = _.map(this._objects, 'id');
          this.filteredObjects = this.control
            .valueChanges
            .pipe(startWith(''), map(this.filter.bind(this)));
        });
    }
  }

  objectSelected(evt: MatAutocompleteSelectedEvent) {
    this.selectedObjectId.emit(evt.option.value);
  }

  filter(value: string): string[] {
    if (_.isEmpty(value)) {
      return this.ids;
    }

    return _.filter(this.ids, (id) => _
      .includes(id.toLowerCase(), value.toLowerCase()));
  }

  isDisabled(id: string) {
    return _.includes(this.disabledIds, id);
  }

  writeValue(value: string) {
    if (value === null) {
      this.control.reset();
      this.control.markAsUntouched();
      this.control.markAsPristine();
    } else {
      this.control.setValue(value);
    }
  }

  registerOnChange(fn: (value: string) => void) {
    this.selectedObjectId.subscribe(fn);
  }

  registerOnTouched() {}

  validate(c: FormControl): ValidationErrors {
    if (this.control.pristine) {
      return null;
    }

    return this.control.errors;
  }
}
