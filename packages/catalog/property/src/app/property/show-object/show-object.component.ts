import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnChanges,
  OnDestroy, OnInit, Output, SimpleChanges, Type
} from '@angular/core';
import {
  ComponentValue, DvService, DvServiceFactory, OnEval
} from '@deja-vu/core';

import {
  getFilteredPropertyNames, getFilteredPropertyNamesFromConfig
} from '../shared/property.model';

import { ShowUrlComponent } from '../show-url/show-url.component';

import { API_PATH } from '../property.config';

import * as _ from 'lodash';


/**
 * Displays an object
 */
@Component({
  selector: 'property-show-object',
  templateUrl: './show-object.component.html',
  styleUrls: ['./show-object.component.css']
})
export class ShowObjectComponent
  implements AfterViewInit, OnDestroy, OnEval, OnInit, OnChanges {
  // A list of fields to wait for
  @Input() waitOn: string[] = [];
  /**
   * component to use to show URL properties
   */
  @Input() showUrl: ComponentValue = {
    type: <Type<Component>> ShowUrlComponent
  };
  /**
   * The ID of the object to show
   */
  @Input() id: string;
  /**
   * The object to show. Can be given instead of ID to avoid
   * retrieving object data from the database
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
  @Input() showBaseUrlsOnly = false;
  /**
   * The object being shown
   */
  @Output() loadedObject = new EventEmitter<any>();
  @Output() errors = new EventEmitter<any>();
  /**
   * Used internally by the concept for passing the configuration
   */
  @Input() _config;

  /**
   * List of property names.
   * If given, causes exactly these properties to be shown.
   * Takes precedence over showOnly and showExclude.
   * Primarily intended for use within the concept.
   * App creators probably want showOnly.
   */
  @Input() properties: string[];
  private urlProps: Set<string> = new Set();

  @Input() includeTimestamp = false;

  showObject;
  refresh = false;
  private dvs: DvService;

  private idOfLoadedObject: string | undefined;

  constructor(
    private elem: ElementRef, private dvf: DvServiceFactory,
    @Inject(API_PATH) private apiPath) {
    this.showObject = this;
  }

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .withDefaultWaiter()
      .withRefreshCallback(() => {
        this.refresh = true;
        this.load();
      })
      .build();

    this.properties = this._config ?
      getFilteredPropertyNamesFromConfig(
        this.showOnly, this.showExclude, this._config) :
      getFilteredPropertyNames(
      this.showOnly, this.showExclude, this.dvs.config);

    const schema = this._config ?
      this._config['schema'] :
      this.dvs.config.getConfig()['schema'];
    this.urlProps = new Set([ ..._
      .chain(schema.properties)
      .pickBy((p) => p.type === 'string' && p.format === 'url')
      .keys()
      .value()
    ]);
  }

  ngAfterViewInit() {
    this.load();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.dvs && this.dvs.waiter.processChanges(changes)) {
      this.load();
    }
  }

  async load() {
    if (!this.dvs) {
      return;
    }
    if (this.canEval()) {
      this.dvs.eval();
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      const res = await this.dvs
        .waitAndGet<{data: {object: Object}, errors: any}>(
          this.apiPath,
          () => ({
            params: {
              inputs: { id: this.id },
              extraInfo: {
                action: 'object',
                returnFields: `
                  id
                  ${this.properties.join('\n')}
                  ${this.includeTimestamp ? 'timestamp' : ''}
                `
              }
            }
          }));
      if (!_.isEmpty(res.errors)) {
        this.idOfLoadedObject = undefined;
        this.object = null;
        this.loadedObject.emit(null);
        this.errors.emit(res.errors);
      } else {
        this.idOfLoadedObject = this.id;
        this.object = res.data.object;
        this.loadedObject.emit(this.object);
        this.errors.emit(null);
      }
      this.refresh = false;
    } else if (this.dvs) {
      this.dvs.noRequest();
    }
  }

  isUrl(propName: string): boolean {
    return this.urlProps.has(propName);
  }

  ngOnDestroy(): void {
    this.dvs.onDestroy();
  }

  private canEval(): boolean {
    return !!(
      this.dvs &&
      (!this.object || this.objectByIdIsOld() || this.refresh) &&
      this.id);
  }

  private objectByIdIsOld(): boolean {
    return this.idOfLoadedObject && this.id !== this.idOfLoadedObject;
  }
}
