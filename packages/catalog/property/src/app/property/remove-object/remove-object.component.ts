import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject,
  Input, OnChanges, OnInit, Output, SimpleChanges
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnExec,
  OnExecSuccess, OnExecFailure, RunService
} from '@deja-vu/core';

import { API_PATH } from '../property.config';

@Component({
  selector: 'property-remove-object',
  templateUrl: './remove-object.component.html',
  styleUrls: ['./remove-object.component.css']
})
export class RemoveObjectComponent implements
  OnInit, OnExec {
  /**
   * id of the object to delete
   */
  @Input() id: string;

  /**
   * Label to delete object
   */
  @Input() buttonLabel = 'Delete Object';
  @Input() showOptionToDelete = true;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, @Inject(API_PATH) private apiPath) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  removeObject() {
    if (this.showOptionToDelete) {
      this.rs.exec(this.elem);
    }
  }

  /**
   * Sync the rating on the server with the rating on the client.
   */
  async dvOnExec() {
    this.gs.post<{ data: any, errors: { message: string }[] }>(this.apiPath, {
      inputs: { id: this.id },
      extraInfo: {
        action: 'delete',
        returnFields: ''
      }
    });
  }
  //
  // dvOnExecSuccess() {
  //   if (this.showOptionToDelete && this.save) {
  //     this.newObjectError = '';
  //     this.newObjectSaved = true;
  //     window.setTimeout(() => {
  //       this.newObjectSaved = false;
  //     }, SAVED_MSG_TIMEOUT);
  //   }
  // }
  //
  // dvOnExecFailure(reason: Error) {
  //   if (this.showOptionToDelete && this.save) {
  //     this.newObjectError = reason.message;
  //   }
  // }
}
