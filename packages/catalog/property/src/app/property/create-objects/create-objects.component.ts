import {
  Component, ElementRef, EventEmitter, Inject, Input,
  OnInit, ViewChildren, QueryList
} from '@angular/core';

import {
  ConfigService, ConfigServiceFactory, GatewayService, GatewayServiceFactory,
  OnExec, RunService
} from '@deja-vu/core';

import {
  AbstractControl, FormBuilder, FormControl,
  FormGroup, FormGroupDirective,
  Validators
} from '@angular/forms';

import { CreateObjectComponent } from '../create-object/create-object.component';

import * as _ from 'lodash';

import { getPropertyNames } from '../shared/property.model';

import { API_PATH } from '../property.config';


const SAVED_MSG_TIMEOUT = 3000;

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
  @Input() objects: any[];

  /**
   * List of Id of the new objects to create
   * Note that currently it is NOT wired to the objects input
   */
  @Input() ids: string[];

  /**
   * A list of initialValue that will be mapped to each of
   * the ids separately. They can be seen as partial objects
   * that serve as templates for the newly created objects.
   */
  @Input() initialValues: any[];

  /**
   * The initialValue that fits for all of the objects that
   * are created.
   */
  @Input() initialValue: any;

  /**
   * The label that shows on the button that triggers
   * the object creation
   */
  @Input() buttonLabel = 'Create Objects';

  /**
   * Only used when there is no objects
   */
  @Input() showOptionToSubmit = true;

  @ViewChildren(CreateObjectComponent) createObjectComponents: QueryList<CreateObjectComponent>;


  private gs: GatewayService;
  private properties: string[];
  config;
  createObjectsForm;

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
  }

  async dvOnExec(): Promise<void> {
    if (_.isEmpty(this.objects)) {
      return;
    }
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
  }

  objectToCreateObjectInput(obj: any) {
    return _.pick(obj, ['id', ...this.properties]);
  }

  submitChildren() {
    this.createObjectComponents.forEach((child) => {
      child.onSubmit();
    });
  }
}
