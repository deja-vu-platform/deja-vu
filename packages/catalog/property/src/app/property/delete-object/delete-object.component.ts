import {
  Component, ElementRef, EventEmitter, Inject,
  Input, OnInit
} from '@angular/core';
import {
  DvService, DvServiceFactory, OnExec, OnExecFailure, OnExecSuccess
} from '@deja-vu/core';

import * as _ from 'lodash';
import { API_PATH } from '../property.config';


const SAVED_MSG_TIMEOUT = 3000;

/**
 * Delete an object from the database
 */
@Component({
  selector: 'property-delete-object',
  templateUrl: './delete-object.component.html',
  styleUrls: ['./delete-object.component.css']
})
export class DeleteObjectComponent
  implements OnInit, OnExec, OnExecSuccess, OnExecFailure {
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

  private dvs: DvService;

  constructor(
    private elem: ElementRef, private dvf: DvServiceFactory,
    @Inject(API_PATH) private apiPath) { }

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .build();
    this.objectDeleted = false;
  }

  deleteObject() {
    if (this.showOptionToDelete) {
      this.dvs.exec();
    }
  }

  async dvOnExec() {
    const res = await this.dvs
      .post<{ data: any, errors: { message: string }[] }>(this.apiPath, {
        inputs: { id: this.id },
        extraInfo: {
          action: 'delete',
          returnFields: ''
        }
      });
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
