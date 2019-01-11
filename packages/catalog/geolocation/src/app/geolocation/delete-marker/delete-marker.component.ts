import { Component, ElementRef, Input, OnInit } from '@angular/core';

import {
  GatewayService, GatewayServiceFactory, OnExec, OnExecFailure, OnExecSuccess,
  RunService
} from 'dv-core';

import * as _ from 'lodash';

const DELETED_MSG_TIMEOUT = 3000;

@Component({
  selector: 'geolocation-delete-marker',
  templateUrl: './delete-marker.component.html',
  styleUrls: ['./delete-marker.component.css']
})
export class DeleteMarkerComponent implements
  OnInit, OnExec, OnExecFailure, OnExecSuccess {
  @Input() id: string;
  @Input() markerDeletedText = 'Marker deleted';
  @Input() buttonLabel = 'Delete Marker';

  markerDeleted = false;
  markerDeletedError: string;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  deleteMarker() {
    this.rs.exec(this.elem);
  }

  async dvOnExec(): Promise<void> {
    const res = await this.gs.post<{
      data: { deleteMarker: { id: string } }, errors: { message: string }[]
    }>('/graphql', {
      inputs: { id: this.id }
    })
      .toPromise();

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
