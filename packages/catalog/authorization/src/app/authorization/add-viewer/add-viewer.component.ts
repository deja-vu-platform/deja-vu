import {
  Component, ElementRef, EventEmitter,
  Inject, Input, OnInit, Output
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnAfterAbort,
  OnAfterCommit, OnRun, RunService
} from 'dv-core';

import * as _ from 'lodash';

import { Resource } from '../shared/authorization.model';

import { API_PATH } from '../authorization.config';

const SAVED_MSG_TIMEOUT = 3000;

@Component({
  selector: 'authorization-add-viewer',
  templateUrl: './add-viewer.component.html',
  styleUrls: ['./add-viewer.component.css']
})
export class AddViewerComponent implements
  OnInit, OnRun, OnAfterCommit, OnAfterAbort {
  @Input() id: string;
  @Input() viewerId: string;
  @Input()
  set viewer(value: { id: string }) {
    this.viewerId = _.get(value, 'id');
  }

  // Presentation Inputs
  @Input() resourceInputLabel = 'Resource Id';
  @Input() viewerInputLabel = 'Viewer Id';
  @Input() buttonLabel = 'Add Viewer to Resource';
  @Input() viewerAddedSuccessText = 'Viewer added to resource';

  viewerAddedSuccess = false;
  viewerAddedErrorText: string;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, @Inject(API_PATH) private apiPath) {}

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  onSubmit() {
    this.rs.run(this.elem);
  }

  dvOnRun() {
    this.gs
      .post(this.apiPath, {
        query: `
          mutation AddViewerToResource($input: AddViewerToResourceInput!) {
            addViewerToResource (input: $input)
          }
        `,
        variables: {
          input: {
            id: this.id,
            viewerId: this.viewerId
          }
        }
      })
      .toPromise();
  }

  dvOnAfterCommit() {
    this.viewerAddedSuccess = true;
    window.setTimeout(() => {
      this.viewerAddedSuccess = false;
    }, SAVED_MSG_TIMEOUT);
  }

  dvOnAfterAbort(reason: Error) {
    this.viewerAddedErrorText = reason.message;
  }
}
