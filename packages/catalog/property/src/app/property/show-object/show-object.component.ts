import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnChanges,
  OnInit, Output, Type
} from '@angular/core';
import {
  Action, ConfigService, ConfigServiceFactory, GatewayService,
  GatewayServiceFactory, OnEval, RunService
} from '@deja-vu/core';
import * as _ from 'lodash';

import {
  getFilteredPropertyNames, getFilteredPropertyNamesFromConfig
} from '../shared/property.model';

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
   * Used internally by the cliche for passing the configuration
   */
  @Input() _config;

  /**
   * List of property names.
   * If given, causes exactly these properties to be shown.
   * Takes precedence over showOnly and showExclude.
   * Primarily intended for use within the cliché.
   * App creators probably want showOnly.
   */
  @Input() properties: string[];
  private urlProps: Set<string> = new Set();

  @Input() includeTimestamp = false;

  showObject;
  private gs: GatewayService;
  private cs: ConfigService;

  private idOfLoadedObject: string | undefined;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, private csf: ConfigServiceFactory,
    @Inject(API_PATH) private apiPath) {
    this.showObject = this;
  }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
    this.cs = this.csf.createConfigService(this.elem);

    this.properties = this._config ?
      getFilteredPropertyNamesFromConfig(
        this.showOnly, this.showExclude, this._config) :
      getFilteredPropertyNames(
      this.showOnly, this.showExclude, this.cs);

    const schema = this._config ?
      this._config['schema'] :
      this.cs.getConfig()['schema'];
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
        .get<{data: {object: Object}, errors: any}>(this.apiPath, {
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
        })
        .subscribe((res) => {
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
        });
    } else if (this.gs) {
      this.gs.noRequest();
    }
  }

  isUrl(propName: string): boolean {
    return this.urlProps.has(propName);
  }

  private canEval(): boolean {
    return !!(
      this.gs &&
      (!this.object || this.objectByIdIsOld()) &&
      this.id);
  }

  private objectByIdIsOld(): boolean {
    return this.idOfLoadedObject && this.id !== this.idOfLoadedObject;
  }
}
