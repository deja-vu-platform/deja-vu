import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnChanges,
  OnInit, Output, Type
} from '@angular/core';
import {
  ConfigService, ConfigServiceFactory, GatewayService,
  GatewayServiceFactory, OnEval, RunService
} from '@deja-vu/core';
import * as _ from 'lodash';

import { getFilteredPropertyNames, getProperties, getPropertyNames } from '../shared/property.model';

import { Options } from 'ng5-slider';
import { API_PATH } from '../property.config';

export const DEFAULT_INTEGER_OPTIONS: Options = {
  floor: 0,
  ceil: 10,
  step: 1,
  showTicks: true
};

export const DEFAULT_NUMBER_OPTIONS: Options = {
  floor: 0,
  ceil: 10,
  step: 0.1
};

/**
 * Displays the filters of a property
 * Currently only supports filter for boolean properties
 */
@Component({
  selector: 'property-filter-objects',
  templateUrl: './filter-objects.component.html',
  styleUrls: ['./filter-objects.component.css']
})
export class FilterObjectsComponent implements AfterViewInit, OnEval, OnInit,
  OnChanges {

  /**
   * The configueration options of the filters
   * for numbers:
   *    the floor, ceil and step size of the selection range
   */
  @Input() propertyOptions = {};

  /**
   * The initialValues of some or all fields of the filter
   */
  @Input() initialValue: Object = {};

  /**
   * List of property names to show the filters
   * A field will be filtered if
   *  (1) it is shown OR
   *  (2) it has input initialValue
   */
  @Input() showOnly: string[];

  /**
   * List of property names to not show the filters
   */
  @Input() showExclude: string[];

  @Output() loadedObjects = new EventEmitter<Object[]>();
  _loadedObjects;

  /**
   * The id of the objects left after filter
   */
  @Output() loadedObjectIds = new EventEmitter<string[]>();

  filterObjects;
  propertyValues = {};
  properties;
  propertiesToShow;
  private gs: GatewayService;
  private cs: ConfigService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, private csf: ConfigServiceFactory,
    @Inject(API_PATH) private apiPath) {
    this.filterObjects = this;
  }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
    this.cs = this.csf.createConfigService(this.elem);
    this.initializePropertiesToInclude();
    this.initializePropertyOptions();
    this.initializePropertyValues();
  }

  ngAfterViewInit() {
    this.load();
  }

  ngOnChanges() {
    this.load();
  }

  async load() {
    if (!this.gs) {
      return;
    }
    if (this.canEval()) {
      this.rs.eval(this.elem);
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      this.gs
        .get<{data: {filteredObjects: Object[]}}>(this.apiPath, {
          params: {
            inputs: { filters: this.propertyValues },
            extraInfo: {
              action: 'objects',
              returnFields: `
                id
                ${ getPropertyNames(this.cs).join('\n')}
              `
            }
          }
        })
        .subscribe((res) => {
          this._loadedObjects = res.data.filteredObjects;
          this.loadedObjects.emit(this._loadedObjects);
          this.loadedObjectIds.emit(_.map(this._loadedObjects, 'id'));
        });
    } else if (this.gs) {
      this.gs.noRequest();
    }
  }

  initializePropertiesToInclude() {
    const propertiesInfo = getProperties(this.cs);
    this.propertiesToShow = getFilteredPropertyNames(
      this.showOnly, this.showExclude, this.cs);
    this.properties = _.filter(propertiesInfo,
      (property) => _.includes(
        _.union(this.propertiesToShow, Object.keys(this.initialValue)),
        property.name)
      );
  }

  initializePropertyOptions() {
    for (const property of this.properties) {
      switch (property.schema.type) {
        case 'integer': {
          this.propertyOptions[property.name] =
            this.propertyOptions[property.name] ?
              { ...DEFAULT_INTEGER_OPTIONS, ...this.propertyOptions[property.name]} :
              DEFAULT_INTEGER_OPTIONS;
          break;
        }
        case 'number': {
          this.propertyOptions[property.name] =
            this.propertyOptions[property.name] ?
              { ...DEFAULT_NUMBER_OPTIONS, ...this.propertyOptions[property.name]} :
              DEFAULT_NUMBER_OPTIONS;
          break;
        }
        default: {
          break;
        }
      }
    }
  }

  initializePropertyValues() {
    for (const property of this.properties) {
      if (property.schema.enum) {
        this.propertyValues[property.name] = this.initialValue[property.name] ?
          this.initialValue[property.name] : { matchValues: [] };
      } else {
        switch (property.schema.type) {
          case 'boolean': {
            this.propertyValues[property.name] = this.initialValue[property.name] ?
              this.initialValue[property.name] : null;
            break;
          }
          case 'integer': {
          } // intentional fallthrough
          case 'number': {
            this.propertyValues[property.name] = {
              minValue: this.initialValue[property.name]
              && this.initialValue[property.name].minValue ?
                this.initialValue[property.name].minValue :
                this.propertyOptions[property.name].floor,
              maxValue: this.initialValue[property.name]
              && this.initialValue[property.name].maxValue ?
                this.initialValue[property.name].maxValue :
                this.propertyOptions[property.name].ceil
            };
            break;
          }
          default: {
            break;
          }
        }
      }
    }
  }

  updateBooleanFilter(fieldName, checked) {
    /* TODO: `null` is used to represent `false`
      to work around graphql turning everything into `true` */
    this.propertyValues[fieldName] = checked ? true : null;
    this.load();
  }

  updateEnumFilter(fieldName, valueName, checked) {
    if (checked) {
      this.propertyValues[fieldName].matchValues.push(valueName);
    } else {
      _.pull(this.propertyValues[fieldName].matchValues, valueName);
    }
    this.load();
  }

  private canEval(): boolean {
    return true;
  }
}
