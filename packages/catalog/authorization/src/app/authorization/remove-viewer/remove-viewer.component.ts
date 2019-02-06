import {
  Component, ElementRef, Inject, Input, OnInit
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnExec, OnExecFailure,
  OnExecSuccess, RunService
} from '@dejavu-lang/core';
import { API_PATH } from '../authorization.config';

import * as _ from 'lodash';

const SAVED_MSG_TIMEOUT = 3000;


@Component({
  selector: 'authorization-remove-viewer',
  templateUrl: './remove-viewer.component.html',
  styleUrls: ['./remove-viewer.component.css']
})
export class RemoveViewerComponent implements
  OnInit, OnExec, OnExecSuccess, OnExecFailure {
  @Input() id: string;
  @Input() viewerId: string;
  @Input()
  set viewer(value: { id: string }) {
    this.viewerId = _.get(value, 'id');
  }

  // Presentation Inputs
  @Input() resourceInputLabel = 'Resource Id';
  @Input() viewerInputLabel = 'Viewer Id';
  @Input() buttonLabel = 'Remove Viewer from Resource';
  @Input() viewerRemovedSuccessText = 'Viewer removed from resource';

  viewerRemovedSuccess = false;
  viewerRemovedErrorText: string;

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
    this.viewerRemovedSuccess = true;
    window.setTimeout(() => {
      this.viewerRemovedSuccess = false;
    }, SAVED_MSG_TIMEOUT);
  }

  dvOnExecFailure(reason: Error) {
    this.viewerRemovedErrorText = reason.message;
  }
}
