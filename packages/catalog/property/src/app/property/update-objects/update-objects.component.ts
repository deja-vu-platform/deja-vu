import {
  Component, ElementRef, EventEmitter, Inject, Input, OnInit,
  QueryList, ViewChildren
} from '@angular/core';

import {
  DvService, DvServiceFactory, OnExec, OnExecFailure, OnExecSuccess
} from '@deja-vu/core';

import * as _ from 'lodash';

import { API_PATH } from '../property.config';
import {
  UpdateObjectComponent
} from '../update-object/update-object.component';

/**
 * Updates an array of objects at once
 * Currently, it only supports update from input initialValues
 * Execution needs to be triggered inside a transaction
 */
@Component({
  selector: 'property-update-objects',
  templateUrl: './update-objects.component.html'
})
export class UpdateObjectsComponent implements OnInit, OnExec {
  /**
   * A nested list of objects that will be updated
   */
  @Input() objectsToUpdate: any[][];

  /**
   * The preset initialValues that overwrites
   * the return value from showObject
   * Currently it only works with objectsToUpdate
   * where each field contains a list of initial values
   * Example:
   *  {
   *    requesterIds: [ 1, 3, 4, 5]
   *    itemName: ["plant", "apple", "pear", "blueberries"]
   *  }
   */
  @Input() initialValues: any;

  /**
   * A list of ids of objects that will be updated
   * TODO: initialValues for this
   */
  @Input() ids: string[];

  /**
   * A list of property names to not show input fields for
   */
  @Input() showExclude: string[] = [];

  @ViewChildren(UpdateObjectComponent) updateObjectComponents:
    QueryList<UpdateObjectComponent>;

  private dvs: DvService;
  config;
  showInputForms = false;
  updateObjectsList: any[] | undefined;

  constructor(
    private elem: ElementRef, private dvf: DvServiceFactory,
    @Inject(API_PATH) private apiPath) { }

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .build();

    this.config = this.dvs.config.getConfig();
    if (!this.objectsToUpdate && this.ids) {
      this.showInputForms = true;
      this.updateObjectsList = _.map(this.ids,
        (id) => ( { id: id } ));
    }
  }

  async dvOnExec(): Promise<void> {
    if (_.isEmpty(this.objectsToUpdate)
      && (_.isEmpty(this.updateObjectsList))) {
      this.dvs.noRequest();

      return;
    }

    let updateInputs = []; // one input per object to update
    if (!_.isEmpty(this.objectsToUpdate)) {
      for (const index of Object.keys(this.objectsToUpdate)) {
        for (const object of this.objectsToUpdate[index]) {
          updateInputs.push({
            ...(_.omit(object, Object.keys(this.initialValues))),
            ...(_.mapValues(this.initialValues, index))
          });
        }
      }
    } else if (!_.isEmpty(this.updateObjectsList)) {
      updateInputs = this.updateObjectsList;
    }

    const res = await this.dvs
      .post<{ data: any, errors: { message: string }[] }>(this.apiPath, {
        inputs: { input: updateInputs },
        extraInfo: {
          action: 'update',
          returnFields: ''
        }
      });
    if (res.errors) {
      throw new Error(_.map(res.errors, 'message')
        .join());
    }
  }

  submit() {
    this.dvs.exec();
  }

  updateIndexedObject(object, index) {
    this.updateObjectsList[index] = object;
  }
}
