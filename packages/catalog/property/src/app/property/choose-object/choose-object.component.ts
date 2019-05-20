import {
  Component, ElementRef, EventEmitter, Inject, Input, OnChanges, OnInit, Output,
  Type
} from '@angular/core';

import {
  Action, GatewayService, GatewayServiceFactory, OnExecSuccess, RunService
} from '@deja-vu/core';
import * as _ from 'lodash';

import { properties, Property } from '../shared/property.model';

import { ShowObjectComponent } from '../show-object/show-object.component';

import { API_PATH } from '../property.config';


/**
 * Allows the user to select an object from a list
 */
@Component({
  selector: 'property-choose-object',
  templateUrl: './choose-object.component.html',
  styleUrls: ['./choose-object.component.css']
})
export class ChooseObjectComponent implements OnInit, OnExecSuccess {
  /**
   * Text to show to prompt the user to choose an object.
   */
  @Input() chooseObjectSelectPlaceholder = 'Choose Object';
  /**
   * Action to use to render each object
   */
  @Input() showObject: Action = {
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
   * Passed to showObject action
   * (For the default showObject, this will cause any URL properties
   * to display without the protocol and path)
   */
  @Input() showBaseUrlsOnly: boolean = false;
  /**
   * Whether or not the action should execute upon the user selecting an object
   */
  @Input() execOnSelection = true;
  /**
   * Whether or not the selection should be cleared when the action
   * executes sucessfully
   */
  @Input() resetOnExecSuccess = false;
  /**
   * If given, the input starts with the object with the given ID selected
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

  chooseObject;
  _selectedObjectId;
  private properties: string[];
  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService,
    @Inject(API_PATH) private apiPath) {
    this.chooseObject = this;
  }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
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
    this.fetchObjects();
  }

  async fetchProperties(): Promise<string[]> {
    const res = await this.gs
      .get<{data: {properties: Property[]}}>(this.apiPath, {
        params: {
          extraInfo: {
            action: 'properties',
            returnFields: 'name'
          }
        }
      })
      .toPromise();

    return _.map(res.data.properties, 'name');
  }

  fetchObjects() {
    if (this.gs) {
      this.gs
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
        })
        .subscribe((res) => {
          this._objects = res.data.objects;
          this.objects.emit(this._objects);
        });
    }
  }

  updateSelected(id: string) {
    this._selectedObjectId = id;
    this.selectedObjectId.emit(id);
    if (this.execOnSelection) {
      setTimeout(() => this.rs.exec(this.elem));
    }
  }

  dvOnExecSuccess() {
    if (this.resetOnExecSuccess) {
      this._selectedObjectId = null;
    }
  }
}
