import {
  Component, ElementRef, EventEmitter, Inject, Input,
  OnInit, ViewChildren, QueryList
} from '@angular/core';

import {
  ConfigService, ConfigServiceFactory, GatewayService, GatewayServiceFactory,
  OnExec, RunService
} from '@deja-vu/core';

import { CreateObjectComponent } from '../create-object/create-object.component';

import * as _ from 'lodash';

import { getPropertyNames } from '../shared/property.model';

import { API_PATH } from '../property.config';

/**
 * Create objects in bulk
 * This action does not display anything.
 * The data for the objects must come from another action.
 * The action's execution must be triggered by another action (in a transaction)
 */
@Component({
  selector: 'property-create-objects',
  templateUrl: './create-objects.component.html',
  styleUrls: ['./create-objects.component.css']
})
export class CreateObjectsComponent implements OnInit, OnExec {
  /**
   * List of objects to save to the database as new entities
   */
  @Input() objects: any[] = [];

  /**
   * List of Id of the new objects to create
   * Note that it is NOT wired to the objects input
   */
  @Input() ids: string[];

  /**
   * A list of initialValue that will be mapped to each of
   * the ids separately. They can be seen as partial objects
   * that serve as templates for the newly created objects.
   */
  @Input() initialValues: any[];

  /**
   * A key-value pair that overrides the initial values of all objects
   */
  @Input() initialValue: any;

  /**
   * List of property names to no show input fields for
   */
  @Input() showExclude: string[] = [];

  /**
   * The label that shows on the button that triggers
   * the object creation
   */
  @Input() buttonLabel = 'Create Objects';

  /**
   * Only used when there is no objects
   */
  @Input() showOptionToSubmit = true;

  @ViewChildren(CreateObjectComponent) createObjectComponents:
    QueryList<CreateObjectComponent>;

  private gs: GatewayService;
  private properties: string[];
  config;
  mergedInitialValues = [];
  showInputForms = false;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, private csf: ConfigServiceFactory,
    @Inject(API_PATH) private apiPath) {}

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);

    const cs = this.csf.createConfigService(this.elem);
    this.config = cs.getConfig();
    this.properties = getPropertyNames(cs);

    if (this.objects) {
      return;
    }

    this.showInputForms = true;
    this.objects = [];

    for (const index of Object.keys(this.ids)) {
      if (this.initialValues && this.initialValues[index] && this.initialValue) {
        this.mergedInitialValues[index] = {...this.initialValues[index], ...this.initialValue};
      } else {
        this.mergedInitialValues[index] = this.initialValue;
      }
      this.objects.push({});
    }
  }

  async dvOnExec(): Promise<void> {
    const res = await this.gs
      .post<{data: any, errors: {message: string}[]}>(this.apiPath, {
        inputs: {
          input: _.map(this.objects, this.objectToCreateObjectInput.bind(this))
        },
        extraInfo: {
          action: 'create',
          returnFields: 'id'
        }
      })
      .toPromise();
    if (res.errors) {
      throw new Error(_.map(res.errors, 'message')
        .join());
    }
    this.createObjectComponents.forEach((child) => {
      child.reset();
    });
  }

  objectToCreateObjectInput(obj: any) {
    return _.pick(obj, ['id', ...this.properties]);
  }

  submit() {
    this.rs.exec(this.elem);
  }

  updateIndexedObject(object, index) {
    this.objects[index] = object;
  }
}
