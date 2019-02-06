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
} from '@dejavu-lang/core';
import * as _ from 'lodash';

import { properties, Property } from '../shared/property.model';

import { ShowUrlComponent } from '../show-url/show-url.component';

import { API_PATH } from '../property.config';


@Component({
  selector: 'property-show-object',
  templateUrl: './show-object.component.html',
  styleUrls: ['./show-object.component.css']
})
export class ShowObjectComponent implements AfterViewInit, OnEval, OnInit,
OnChanges {
  @Input() showUrl: Action = {
    type: <Type<Component>> ShowUrlComponent
  };
  @Input() id: string;
  @Input() object: any;
  @Input() showOnly: string[];
  @Input() showExclude: string[];
  @Input() showBaseUrlsOnly: boolean = false;
  @Output() loadedObject = new EventEmitter<any>();

  // Internal input
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
