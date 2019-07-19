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
  @Output() loadedObjects = new EventEmitter<Object[]>();
  _loadedObjects;

  /**
   * The id of the objects left after filter
   */
  @Output() loadedObjectIds = new EventEmitter<string[]>();

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
          object[property.name] = null;
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
        .get<{data: {filteredObjects: Object[]}}>(this.apiPath, {
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
          this._loadedObjects = res.data.filteredObjects;
          this.loadedObjects.emit(this._loadedObjects);
          this.loadedObjectIds.emit(_.map(this._loadedObjects, 'id'));
        });
    } else if (this.gs) {
      this.gs.noRequest();
    }
  }

  /*
  Only supporting boolean inputs right now
   */
  updateFieldFilter(fieldName, fieldValue) {
    /* TODO: `null` is used to represent `false`
      to work around graphql turning everything into `true` */
    this.propertyValues[fieldName] = fieldValue ? true : null;
    this.load();
  }

  private canEval(): boolean {
    return true;
  }
}
