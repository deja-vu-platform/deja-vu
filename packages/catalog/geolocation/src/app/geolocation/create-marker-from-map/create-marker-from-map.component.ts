import {
  Component, ElementRef, EventEmitter, Input, OnInit, Output
} from '@angular/core';

import {
  DvService, DvServiceFactory, OnExec, OnExecFailure, OnExecSuccess
} from '@deja-vu/core';

import * as _ from 'lodash';

import { DEFAULT_MAP_ID, Marker } from '../shared/geolocation.model';

const SAVED_MSG_TIMEOUT = 3000;

@Component({
  selector: 'geolocation-create-marker-from-map',
  templateUrl: './create-marker-from-map.component.html',
  styleUrls: ['./create-marker-from-map.component.css']
})
export class CreateMarkerFromMapComponent
  implements OnInit, OnExec, OnExecFailure, OnExecSuccess {
  @Input() id: string | undefined;
  @Input() mapId = DEFAULT_MAP_ID;

  marker: Marker;

  // Presentation Text
  @Input() buttonLabel = 'Create Marker';
  @Input() showOptionToSubmit = true;

  @Input() newMarkerSavedText = 'New marker saved';
  newMarkerSaved = false;
  newMarkerError: string;

  private dvs: DvService;

  constructor(
    private readonly elem: ElementRef,
    private readonly dvf: DvServiceFactory) {}

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .build();
  }

  onSubmit() {
    this.dvs.exec();
  }

  updateMarker(marker: Marker) {
    this.marker = marker;
  }

  async dvOnExec(): Promise<void> {
    const res = await this.dvs
      .post<{ data: any, errors: { message: string }[] }>('/graphql', {
        inputs: {
          input: {
            id: this.id,
            title: this.marker.title,
            latitude: this.marker.latitude,
            longitude: this.marker.longitude,
            mapId: 'default'
          }
        },
        extraInfo: {
          returnFields: `
            id
            title
            latitude
            longitude
            mapId
          `
        }
      });

    if (res.errors) {
      throw new Error(_.map(res.errors, 'message')
        .join());
    }
  }

  dvOnExecSuccess() {
    this.newMarkerSaved = true;
    this.newMarkerError = '';
    window.setTimeout(() => {
      this.newMarkerSaved = false;
    }, SAVED_MSG_TIMEOUT);
  }

  dvOnExecFailure(reason: Error) {
    this.newMarkerError = reason.message;
  }
}
