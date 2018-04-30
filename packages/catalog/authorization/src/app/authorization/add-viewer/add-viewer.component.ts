import {
  Component, ElementRef, EventEmitter,
  Input, OnInit, Output
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnAfterAbort,
  OnAfterCommit, OnRun, RunService
} from 'dv-core';

import * as _ from 'lodash';

import { Resource } from '../shared/authorization.model';

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
    private rs: RunService) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  onSubmit() {
    this.rs.run(this.elem);
  }

  dvOnRun() {
    this.gs
      .post('/graphql', {
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
