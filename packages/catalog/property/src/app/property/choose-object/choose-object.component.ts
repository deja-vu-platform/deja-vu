import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input,
  OnInit, Output, Type
} from '@angular/core';

import {
  ComponentValue, DvService, DvServiceFactory, OnExecSuccess
} from '@deja-vu/core';
import * as _ from 'lodash';

import { getFilteredPropertyNames } from '../shared/property.model';

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
export class ChooseObjectComponent
  implements OnInit, AfterViewInit, OnExecSuccess {
  /**
   * Text to show to prompt the user to choose an object.
   */
  @Input() chooseObjectSelectPlaceholder = 'Choose Object';
  /**
   * Component to use to render each object
   */
  @Input() showObject: ComponentValue = {
    type: <Type<Component>> ShowObjectComponent
  };
  /**
   * List of property names to pass to showObject actoin
   * (For the default showObject, this will cause only
   * these properties to be shown)
   */
  @Input() showOnly: string[];
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
   * Whether or not the component should execute upon the user selecting an
   * object
   */
  @Input() execOnSelection = true;
  /**
   * Whether or not the selection should be cleared when the component
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
  config;
  private properties: string[];
  private dvs: DvService;

  constructor(
    private elem: ElementRef, private dvf: DvServiceFactory,
    @Inject(API_PATH) private apiPath) {
    this.chooseObject = this;
  }

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .build();
    this.config = this.dvs.config.getConfig();
  }

  ngAfterViewInit() {
    this.dvs.eval();
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      this.properties = getFilteredPropertyNames(
        this.showOnly, this.showExclude, this.dvs.config);

      const res = await this.dvs
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
        });
      this._objects = res.data.objects;
      this.objects.emit(this._objects);
    } else if (this.dvs) {
      this.dvs.noRequest();
    }
  }

  private canEval(): boolean {
    return !!(this.dvs);
  }

  updateSelected(id: string) {
    this._selectedObjectId = id;
    this.selectedObjectId.emit(id);
    if (this.execOnSelection) {
      setTimeout(() => this.dvs.exec());
    }
  }

  dvOnExecSuccess() {
    if (this.resetOnExecSuccess) {
      this._selectedObjectId = null;
    }
  }
}
