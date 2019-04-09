import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnChanges,
  OnInit, Output, Type
} from '@angular/core';
import {
  Action,
  GatewayService,
  GatewayServiceFactory,
  OnEval,
  RunService
} from '@deja-vu/core';
import * as _ from 'lodash';

import { properties, Property } from '../shared/property.model';

import { ShowUrlComponent } from '../show-url/show-url.component';

import { API_PATH } from '../property.config';

/**
 * Displays an object
 */
@Component({
  selector: 'property-show-object',
  templateUrl: './show-object.component.html',
  styleUrls: ['./show-object.component.css']
})
export class ShowObjectComponent implements AfterViewInit, OnEval, OnInit,
OnChanges {
  /**
   * Action to use to show URL properties
   */
  @Input() showUrl: Action = {
    type: <Type<Component>> ShowUrlComponent
  };
  /**
   * The ID of the object to show
   */
  @Input() id: string;
  /**
   * The actual data of the object to show. Can be given instead of ID to avoid
   * needing to retrieve object data from the database that you already have
   */
  @Input() object: any;
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
   * Passed to showUrl
   * (For the default showUrl, this will cause any URL properties
   * to display without the protocol and path)
   */
  @Input() showBaseUrlsOnly: boolean = false;
  /**
   * The object being shown
   */
  @Output() loadedObject = new EventEmitter<any>();

  /**
   * List of property names.
   * If given, causes exactly these properties to be shown.
   * Takes precedence over showOnly and showExclude.
   * Primarily intended for use within the cliché.
   * App creators probably want showOnly.
   */
  @Input() properties: string[];
  propertySchemas: { [propName: string]: {
    type: string,
    format?: string
  }} = {};

  showObject;
  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, @Inject(API_PATH) private apiPath) {
    this.showObject = this;
  }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
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
    if (!this.properties) {
      this.properties = properties(
        this.showOnly, this.showExclude, await this.fetchProperties());
    }
    if (this.canEval()) {
      this.rs.eval(this.elem);
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      this.gs
        .get<{data: {object: Object}}>(this.apiPath, {
          params: {
            inputs: { id: this.id },
            extraInfo: {
              action: 'object',
              returnFields: `${this.properties.join('\n')}`
            }
          }
        })
        .subscribe((res) => {
          this.object = res.data.object;
          this.loadedObject.emit(this.object);
        });
    }
  }

  async fetchProperties(): Promise<string[]> {
    const res = await this.gs
      .get<{data: {properties: Property[]}}>(this.apiPath, {
        params: {
          extraInfo: {
            action: 'properties',
            returnFields: `
              name
              schema
            `
          }
        }
      })
      .toPromise();

    const properties = res.data.properties;
    _.forEach(properties, (prop) => {
      this.propertySchemas[prop.name] = JSON.parse(prop.schema);
    });
    return _.map(properties, 'name');
  }

  isUrl(propName: string): boolean {
    return this.propertySchemas[propName] &&
      this.propertySchemas[propName].type === 'string' &&
      this.propertySchemas[propName].format === 'url';
  }

  private canEval(): boolean {
    return !!(!this.object && this.id && this.properties && this.gs);
  }
}
