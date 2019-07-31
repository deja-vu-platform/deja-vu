import {
  Component, ElementRef, EventEmitter, Inject, Input, OnInit
} from '@angular/core';

import {
  ConfigServiceFactory,
  GatewayService,
  GatewayServiceFactory,
  OnExec,
  OnExecFailure,
  OnExecSuccess,
  RunService
} from '@deja-vu/core';

import * as _ from 'lodash';

import { API_PATH } from '../property.config';

/**
 * Updates an array of objects at once
 * Currently, it only supports update from input initialValues
 * Execution needs to be triggered inside a transaction
 * TODO: user input forms
 */
@Component({
  selector: 'property-update-objects',
  templateUrl: './update-objects.component.html',
})
export class UpdateObjectsComponent
  implements OnInit, OnExec {
  /**
   * A nested list of objects will be updated
   */
  @Input() objectsToUpdate: any[][];

  /**
   * The preset initialValues that overwrites
   * the return value from showObject
   */
  @Input() initialValues: any;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, private csf: ConfigServiceFactory,
    @Inject(API_PATH) private apiPath) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  async dvOnExec(): Promise<void> {
    const updateInputs = []; // one input per object to update
    for (const index of Object.keys(this.objectsToUpdate)) {
      for (const object of this.objectsToUpdate[index]) {
        updateInputs.push({
          ...(_.omit(object, Object.keys(this.initialValues))),
          ...(_.mapValues(this.initialValues, index))
        });
      }
    }
    const res = await this.gs
      .post<{ data: any, errors: { message: string }[] }>(this.apiPath, {
        inputs: { input: updateInputs },
        extraInfo: {
          action: 'update',
          returnFields: ''
        }
      })
      .toPromise();
    if (res.errors) {
      throw new Error(_.map(res.errors, 'message')
        .join());
    }
  }
}
