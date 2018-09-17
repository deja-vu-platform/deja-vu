import { Component, ElementRef, Input, OnInit } from '@angular/core';

import {
  GatewayService, GatewayServiceFactory, OnAfterAbort, OnAfterCommit, OnRun,
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
  OnInit, OnRun, OnAfterAbort, OnAfterCommit {
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
    this.rs.run(this.elem);
  }

  async dvOnRun(): Promise<void> {
    const res = await this.gs.post<{
      data: { deleteMarker: { id: string } }, errors: { message: string }[]
    }>('/graphql', {
      query: `mutation {
        deleteMarker(id: "${this.id}")
      }`
    })
      .toPromise();

    if (res.errors) {
      throw new Error(_.map(res.errors, 'message')
        .join());
    }
  }

  dvOnAfterCommit() {
    this.markerDeleted = true;
    this.markerDeletedError = '';
    window.setTimeout(() => {
      this.markerDeleted = false;
    }, DELETED_MSG_TIMEOUT);
  }

  dvOnAfterAbort(reason: Error) {
    this.markerDeletedError = reason.message;
  }
}
