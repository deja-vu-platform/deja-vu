import {
  Component, ElementRef, Inject, Input, OnInit
} from '@angular/core';
import {
  DvService, DvServiceFactory, OnExec, OnExecFailure, OnExecSuccess
} from '@deja-vu/core';
import { API_PATH } from '../authorization.config';

import * as _ from 'lodash';

const SAVED_MSG_TIMEOUT = 3000;


@Component({
  selector: 'authorization-remove-viewer',
  templateUrl: './remove-viewer.component.html',
  styleUrls: ['./remove-viewer.component.css']
})
export class RemoveViewerComponent
  implements OnInit, OnExec, OnExecSuccess, OnExecFailure {
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
  @Input() showResourceInputField = true;
  @Input() showViewerInputField = true;

  viewerRemovedSuccess = false;
  viewerRemovedErrorText: string;

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
    this.viewerRemovedSuccess = true;
    window.setTimeout(() => {
      this.viewerRemovedSuccess = false;
    }, SAVED_MSG_TIMEOUT);
  }

  dvOnExecFailure(reason: Error) {
    this.viewerRemovedErrorText = reason.message;
  }
}
