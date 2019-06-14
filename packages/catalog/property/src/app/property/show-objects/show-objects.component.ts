import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnChanges,
  OnInit, Output, Type
} from '@angular/core';
import {
  Action,
  ConfigService, ConfigServiceFactory,
  GatewayService,
  GatewayServiceFactory,
  OnEval,
  RunService
} from '@deja-vu/core';
import * as _ from 'lodash';

import { getFilteredPropertyNames } from '../shared/property.model';

import { ShowObjectComponent } from '../show-object/show-object.component';

import { API_PATH } from '../property.config';


/**
 * Display all objects
 */
@Component({
  selector: 'property-show-objects',
  templateUrl: './show-objects.component.html',
  styleUrls: ['./show-objects.component.css']
})
export class ShowObjectsComponent implements AfterViewInit, OnEval, OnInit,
OnChanges {
  /**
   * Text to display when there are no objects
   */
  @Input() noObjectsToShowText = 'No objects';
  /**
   * Action to use to render each object
   */
  @Input() showObject: Action = {
    type: <Type<Component>> ShowObjectComponent
  };
  _objects: Object[] = [];
  /**
   * List of property names to pass to showObject action
   * (For the default showObject, this will cause only
   * these properties to be shown)
   */
  @Input() showOnly: string[];
  /**
   * input object type: fieldName: fieldValue
   * will return only the objects with its fieldName matching fieldValue
   * currently, number of fields is restricted to one
   */
  @Input() fieldMatching: Object;
  /**
   * List of property names to pass to showObject action
   * (For the default showObject, this will cause
   * these properties to not be shown)
   */
  @Input() showExclude: string[];
  /**
   * Passed to showObject action
   * (For the default showObject, this will cause any URL properties
   * to display without the protocol and path)
   */
  @Input() showBaseUrlsOnly: boolean = false;
  /**
   * All objects
   */
  @Output() objects = new EventEmitter<Object[]>();
  /**
   * Just the IDs of the outputted objects
   */
  @Output() objectIds = new EventEmitter<string[]>();

  properties: string[];
  showObjects;
  private gs: GatewayService;
  private cs: ConfigService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, private csf: ConfigServiceFactory,
    @Inject(API_PATH) private apiPath) {
    this.showObjects = this;
  }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
    this.cs = this.csf.createConfigService(this.elem);
  }

  ngAfterViewInit() {
    this.load();
  }

  ngOnChanges() {
    this.load();
  }

  async load() {
    if (this.canEval()) {
      this.rs.eval(this.elem);
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      this.properties = getFilteredPropertyNames(
        this.showOnly, this.showExclude, this.cs);
      this.gs
        .get<{data: {objects: Object[]}}>(this.apiPath, {
          params: {
            inputs: { fields: this.fieldMatching },
            extraInfo: {
              action: 'objects',
              returnFields: `
                id
                ${this.properties.join('\n')}
              `
            }
          }
        })
        .subscribe((res) => {
          this._objects = res.data.objects;
          this.objects.emit(this._objects);
          this.objectIds.emit(_.map(this._objects, 'id'));
        });
    } else if (this.gs) {
      this.gs.noRequest();
    }
  }

  private canEval(): boolean {
    return !!(this.gs);
  }
}
