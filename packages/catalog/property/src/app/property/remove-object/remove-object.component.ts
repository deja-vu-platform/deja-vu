import {
  Component, ElementRef, EventEmitter, Inject,
  Input, OnInit
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnExec,
  OnExecFailure, OnExecSuccess, RunService
} from '@deja-vu/core';

import * as _ from 'lodash';
import { API_PATH } from '../property.config';


const SAVED_MSG_TIMEOUT = 3000;

/**
 * Remove an object from the database
 */
@Component({
  selector: 'property-remove-object',
  templateUrl: './remove-object.component.html',
  styleUrls: ['./remove-object.component.css']
})
export class RemoveObjectComponent implements
  OnInit, OnExec, OnExecSuccess, OnExecFailure {
  /**
   * id of the object to delete
   */
  @Input() id: string;

  /**
   * Label of the button to delete object
   */
  @Input() buttonLabel = 'Delete Object';

  /**
   * Whether or not to show the button and success/error messages
   * ususally set to false is part of transaction
   */
  @Input() showOptionToDelete = true;

  /**
   * Text to show when the object is deleted
   */
  @Input() objectDeletedText = 'Successfully Deleted';

  deleteObjectError: string;
  objectDeleted: Boolean;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, @Inject(API_PATH) private apiPath) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
    this.objectDeleted = false;
  }

  removeObject() {
    if (this.showOptionToDelete) {
      this.rs.exec(this.elem);
    }
  }

  async dvOnExec() {
    const res = await this.gs
      .post<{ data: any, errors: { message: string }[] }>(this.apiPath, {
      inputs: { id: this.id },
      extraInfo: {
        action: 'delete',
        returnFields: ''
      }
    })
    .toPromise();
    if (res.errors) {
      throw new Error(_.map(res.errors, 'message')
        .join());
    }
  }

  dvOnExecSuccess() {
    if (this.showOptionToDelete) {
      this.deleteObjectError = '';
      this.objectDeleted = true;
      window.setTimeout(() => {
        this.objectDeleted = false;
      }, SAVED_MSG_TIMEOUT);
    }
  }

  dvOnExecFailure(reason: Error) {
    if (this.showOptionToDelete) {
      this.deleteObjectError = reason.message;
    }
  }
}
