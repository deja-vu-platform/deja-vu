import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnChanges,
  OnInit, Output, Type
} from '@angular/core';
import {
  Action, ConfigService, ConfigServiceFactory, GatewayService,
  GatewayServiceFactory, OnEval, RunService
} from '@deja-vu/core';
import * as _ from 'lodash';

import { Property, getProperties } from '../shared/property.model';

import { API_PATH } from '../property.config';

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
   * List of property names.
   * If given, causes only these properties to be shown.
   */
  @Input() showOnly: string[];
  /**
   * List of property names.
   * If given, causes these properties to not be shown.
   */
  @Input() showExclude: string[];
  /**
   * The object left after filter
   */
  @Output() loadedObject = new EventEmitter<any>();
  _loadedObjects;
  /**
   * List of properties.
   * If given, causes exactly these properties to be shown.
   * Takes precedence over showOnly and showExclude.
   * Primarily intended for use within the cliché.
   * App creators probably want showOnly.
   */
  @Input() properties: Property[];
  filterObjects;
  propertyValues;
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

    this.properties = getProperties(this.cs);
    this.propertyValues = _.reduce(this.properties,
      (object, property, index) => {
        if (property.schema.type === 'boolean') {
          object[property.name] = false;
        }

        return object;
      }, {});
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
        .get<{data: {objects: Object[]}}>(this.apiPath, {
          params: {
            inputs: { filters: this.propertyValues },
            extraInfo: {
              action: 'objects',
              returnFields: `
                id
                ${_.map(this.properties, (property) => (property.name))
                .join('\n')}
              `
            }
          }
        })
        .subscribe((res) => {
          console.log("RESULTS");
          console.log(res);
          this._loadedObjects = res.data.objects;
          this.loadedObject.emit(this._loadedObjects);
        });
    } else if (this.gs) {
      this.gs.noRequest();
    }
  }

  updateFieldFilter(fieldName, fieldValue) {
    this.propertyValues[fieldName] = fieldValue;
    this.load();
  }

  private canEval(): boolean {
    return true;
  }
}
