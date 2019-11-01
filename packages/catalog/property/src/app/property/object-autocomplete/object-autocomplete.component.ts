import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnInit,
  Output, Type, ViewChild
} from '@angular/core';
import {
  AbstractControl, ControlValueAccessor, FormBuilder, FormControl,
  FormGroup, FormGroupDirective, NG_VALIDATORS, NG_VALUE_ACCESSOR,
  ValidationErrors, Validator, Validators
} from '@angular/forms';

import { MatAutocompleteSelectedEvent } from '@angular/material';

import { Observable } from 'rxjs/Observable';
import { map } from 'rxjs/operators/map';
import { startWith } from 'rxjs/operators/startWith';

import * as _ from 'lodash';

import {
  ComponentValue, DvService, DvServiceFactory, OnEval
} from '@deja-vu/core';

import { getFilteredPropertyNames } from '../shared/property.model';

import { ShowObjectComponent } from '../show-object/show-object.component';

import { API_PATH } from '../property.config';


/**
 * Like Choose Object but instead of showing all objects in a list,
 * this allows the user to search for on object with some property value
 */
@Component({
  selector: 'property-object-autocomplete',
  templateUrl: './object-autocomplete.component.html',
  styleUrls: ['./object-autocomplete.component.css']
})
export class ObjectAutocompleteComponent
  implements AfterViewInit, OnInit, OnEval, ControlValueAccessor, Validator {
  /**
   * Text to show to prompt the user to choose an object.
   */
  @Input() objectAutocompletePlaceholder = 'Choose One';
  /**
   * Whether or not choosing an object is required
   * (if this is component is used in a larger form)
   */
  @Input() required = true;
  /**
   * Text so show if the user tries to execute the component before selecting
   * an object.
   * HTML is supported here
   */
  @Input() requiredErrorMsg = `
    This field is <strong>required</strong>
  `;
  /**
   * Function which takes an object ID corresponding to an object which is
   * not a valid option and returns text (which can use HTML) to show the the
   * user explaining the error
   */
  @Input() notAnOptionErrorMsgFn = ((selectedId) => `
    ${selectedId} is not a valid option`);
  /**
   * List of object IDs for objects which cannot be chosen
   */
  @Input() disabledIds: string[] = [];
  /**
   * Component to use to render each object
   */
  @Input() showObject: ComponentValue = {
    type: <Type<Component>> ShowObjectComponent
  };
  /**
   * List of property names to pass to showObject actoin
   * (For the default showObject, this will cause only
   * these properties to be shown)
   */
  @Input() showOnly: string[];
  /**
   * List of property names to pass to showObject actoin
   * (For the default showObject, this will cause
   * these properties to not be shown)
   */
  @Input() showExclude: string[];
  /**
   * Passed to showObject component
   * (For the default showObject, this will cause any URL properties
   * to display without the protocol and path)
   */
  @Input() showBaseUrlsOnly = false;
  /**
   * If given, the select input with the object with the given ID selected
   */
  @Input() set initialObjectId(id: string) {
    this._selectedObjectId = id;
    this.selectedObjectId.emit(id);
  }
  /**
   * All objects
   */
  @Output() objects = new EventEmitter<Object[]>();
  _objects: Object[] = [];
  /**
   * The ID of the selected object
   */
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
  private dvs: DvService;

  constructor(
    private elem: ElementRef, private dvf: DvServiceFactory,
    @Inject(API_PATH) private apiPath) {}

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .build();
  }

  ngAfterViewInit() {
    this.load();
  }

  async load() {
    if (!this.dvs) {
      return;
    }
    this.dvs.eval();
  }

  async dvOnEval(): Promise<void> {
    if (this.dvs) {
      this.properties = getFilteredPropertyNames(
        this.showOnly, this.showExclude, this.dvs.config);
      const res = await this.dvs
        .get<{data: {objects: Object[]}}>(this.apiPath, {
          params: {
            extraInfo: {
              action: 'objects',
              returnFields: `
                id
                ${this.properties.join('\n')}
              `
            }
          }
        });
      this._objects = res.data.objects;
      this.objects.emit(this._objects);
      this.ids = _.map(this._objects, 'id');
      this.filteredObjects = this.control
        .valueChanges
        .pipe(startWith(''), map(this.filter.bind(this)));
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
