import { Component, ElementRef, Inject, Input, OnInit } from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnExec, OnExecFailure,
  OnExecSuccess, RunService
} from '@deja-vu/core';

import * as _ from 'lodash';

import { API_PATH } from '../authorization.config';

const SAVED_MSG_TIMEOUT = 3000;

@Component({
  selector: 'authorization-add-viewer',
  templateUrl: './add-viewer.component.html',
  styleUrls: ['./add-viewer.component.css']
})
export class AddViewerComponent implements
  OnInit, OnExec, OnExecSuccess, OnExecFailure {
  @Input() id: string;
  @Input() viewerId: string;
  @Input() set viewer(value: { id: string }) {
    this.viewerId = _.get(value, 'id');
  }

  // Presentation Inputs
  @Input() resourceInputLabel = 'Resource Id';
  @Input() viewerInputLabel = 'Viewer Id';
  @Input() buttonLabel = 'Add Viewer to Resource';
  @Input() viewerAddedSuccessText = 'Viewer added to resource';
  @Input() showDoneMessage = true;
  @Input() showResourceInputField = true;
  @Input() showViewerInputField = true;

  viewerAddedSuccess = false;
  viewerAddedErrorText: string;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, @Inject(API_PATH) private apiPath) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  onSubmit() {
    this.rs.exec(this.elem);
  }

  dvOnExec() {
    this.gs
      .post(this.apiPath, {
        inputs: {
          input: {
            id: this.id,
            viewerId: this.viewerId
          }
        }
      })
      .toPromise();
  }

  dvOnExecSuccess() {
    this.viewerAddedSuccess = true;
    window.setTimeout(() => {
      this.viewerAddedSuccess = false;
    }, SAVED_MSG_TIMEOUT);
  }

  dvOnExecFailure(reason: Error) {
    this.viewerAddedErrorText = reason.message;
  }
}
