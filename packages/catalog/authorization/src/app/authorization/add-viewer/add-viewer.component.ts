import { Component, ElementRef, Inject, Input, OnInit } from '@angular/core';
import {
  DvService, DvServiceFactory, OnExec, OnExecFailure,
  OnExecSuccess
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

  private dvs: DvService;

  constructor(
    private elem: ElementRef, private dvf: DvServiceFactory,
    @Inject(API_PATH) private apiPath) { }

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .build();
  }

  onSubmit() {
    this.dvs.exec();
  }

  async dvOnExec() {
    await this.dvs.post(this.apiPath, {
      inputs: {
        input: {
          id: this.id,
          viewerId: this.viewerId
        }
      }
    });
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
