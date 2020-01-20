import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input,
  OnChanges, OnDestroy, OnInit, Output, SimpleChanges, Type
} from '@angular/core';
import {
  ComponentValue, DvService, DvServiceFactory, OnEval
} from '@deja-vu/core';

import {
  adjustFieldMatching, getFilteredPropertyNames,
  getObjectTitleFromConfig, getPropertiesFromConfig
} from '../shared/property.model';

import { ShowObjectComponent } from '../show-object/show-object.component';

import { API_PATH } from '../property.config';

import * as _ from 'lodash';
import { plural } from 'pluralize';
import { filter, take } from 'rxjs/operators';


/**
 * Display all objects
 */
@Component({
  selector: 'property-show-objects',
  templateUrl: './show-objects.component.html',
  styleUrls: ['./show-objects.component.css']
})
export class ShowObjectsComponent
  implements AfterViewInit, OnDestroy, OnEval, OnInit, OnChanges {
  /**
   * Text to display when there are no objects
   */
  @Input() noObjectsToShowText;
  /**
   * Component to use to render each object
   */
  @Input() showObject: ComponentValue = {
    type: <Type<Component>> ShowObjectComponent
  };
  _objects: Object[] = [];
  /**
   * List of property names to pass to showObject component
   * (For the default showObject, this will cause only
   * these properties to be shown)
   */
  @Input() showOnly: string[];
  /**
   * input object type:{ fieldName: fieldValue }
   * will return only the objects with its fieldNames matching the fieldValues.
   * You can also provide a list of fields to wait on with `waitOn`.
   * e.g., { parentId: $parentId, waitOn: ['parentId' ] }
   */
  @Input() fieldMatching = {};
  // Watcher of changes to fields specified in `waitOn`
  // Emits the field name that changes
  fieldChange = new EventEmitter<string>();
  activeWaits = new Set<string>();
  /**
   * List of property names to pass to showObject component
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
   * All objects
   */
  @Output() objects = new EventEmitter<Object[]>();
  /**
   * Just the IDs of the outputted objects
   */
  @Output() objectIds = new EventEmitter<string[]>();

  @Input() includeTimestamp = false;

  properties: string[];
  showObjects;
  loaded = false;

  config;
  schema;
  private dvs: DvService;

  constructor(
    private elem: ElementRef, private dvf: DvServiceFactory,
    @Inject(API_PATH) private apiPath) {
    this.showObjects = this;
  }

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .withRefreshCallback(() => { this.load(); })
      .build();
    this.config = this.dvs.config.getConfig();
    this.schema = getPropertiesFromConfig(this.config);

    const objTitle = getObjectTitleFromConfig(this.config);
    if (this.noObjectsToShowText === undefined) {
      this.noObjectsToShowText =
        `No ${plural(objTitle.toLowerCase())} to show yet`;
    }
  }

  ngAfterViewInit() {
    this.load();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!_.isEmpty(this.fieldMatching['waitOn'])) {
      const fmChanges = changes['fieldMatching'];
      if (fmChanges) {
        for (const field of this.fieldMatching['waitOn']) {
          if (!this.waitOnFieldIsNil(field)) {
            this.fieldChange.emit(field);
          }
        }
      }
    }

    this.load();
  }

  async load() {
    if (this.canEval()) {
      this.dvs.eval();
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      const fmWaitOn = _.get(this.fieldMatching, 'waitOn');
      if (!_.isEmpty(fmWaitOn)) {
        await Promise.all(_.chain(fmWaitOn)
          .filter((field) => this.waitOnFieldIsNil(field))
          .map((fieldToWaitFor) => this.fieldChange
            .pipe(filter((field) => field === fieldToWaitFor), take(1))
            .toPromise())
          .value());
      }
      this.properties = getFilteredPropertyNames(
        this.showOnly, this.showExclude, this.dvs.config);
      const adjustedFields = adjustFieldMatching(
        _.omit(this.fieldMatching, 'waitOn'), this.schema);
      const res = await this.dvs
        .get<{data: {objects: Object[]}}>(this.apiPath, {
          params: {
            inputs: { fields: adjustedFields },
            extraInfo: {
              action: 'objects',
              returnFields: `
                id
                ${this.properties.join('\n')}
                ${this.includeTimestamp ? 'timestamp' : ''}
              `
            }
          }
        });
      this._objects = res.data.objects;
      this.objects.emit(this._objects);
      this.objectIds.emit(_.map(this._objects, 'id'));
      this.loaded = true;
    } else if (this.dvs) {
      this.dvs.noRequest();
    }
  }

  ngOnDestroy(): void {
    this.dvs.onDestroy();
  }

  private canEval(): boolean {
    return !!(this.dvs);
  }

  private waitOnFieldIsNil(field) {
    const fValue = _.get(this.fieldMatching, field);
    if (_.isNil(fValue)) {
      return true;
    }
    if (_.isPlainObject(fValue)) {
      const qValuesUndefined = _.filter(_.keys(fValue),
        (k) => k.startsWith('q_') && fValue[k] === undefined);

      return qValuesUndefined.length > 0;
    }

    return false;
  }
}
