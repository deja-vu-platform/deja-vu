import { Component, ElementRef, Input, OnInit } from '@angular/core';

import {
  DvService, DvServiceFactory, OnExec, OnExecFailure, OnExecSuccess
} from '@deja-vu/core';

import * as _ from 'lodash';

const DELETED_MSG_TIMEOUT = 3000;

@Component({
  selector: 'geolocation-delete-marker',
  templateUrl: './delete-marker.component.html',
  styleUrls: ['./delete-marker.component.css']
})
export class DeleteMarkerComponent
  implements OnInit, OnExec, OnExecFailure, OnExecSuccess {
  @Input() id: string;
  @Input() markerDeletedText = 'Marker deleted';
  @Input() buttonLabel = 'Delete Marker';

  markerDeleted = false;
  markerDeletedError: string;

  private dvs: DvService;

  constructor(
    private readonly elem: ElementRef,
    private readonly dvf: DvServiceFactory) {}

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .build();
  }

  deleteMarker() {
    this.dvs.exec();
  }

  async dvOnExec(): Promise<void> {
    const res = await this.dvs.post<{
      data: { deleteMarker: { id: string } }, errors: { message: string }[]
    }>('/graphql', {
      inputs: { id: this.id }
    });

    if (res.errors) {
      throw new Error(_.map(res.errors, 'message')
        .join());
    }
  }

  dvOnExecSuccess() {
    this.markerDeleted = true;
    this.markerDeletedError = '';
    window.setTimeout(() => {
      this.markerDeleted = false;
    }, DELETED_MSG_TIMEOUT);
  }

  dvOnExecFailure(reason: Error) {
    this.markerDeletedError = reason.message;
  }
}
