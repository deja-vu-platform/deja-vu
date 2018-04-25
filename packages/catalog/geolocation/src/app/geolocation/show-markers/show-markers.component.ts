import {
  Component, ElementRef, Input, OnChanges, OnInit, Type
} from '@angular/core';
import { Action, GatewayService, GatewayServiceFactory } from 'dv-core';
import * as _ from 'lodash';

import { ShowMarkerComponent } from '../show-marker/show-marker.component';

import { Marker } from '../shared/geolocation.model';


@Component({
  selector: 'geolocation-show-markers',
  templateUrl: './show-markers.component.html',
  styleUrls: ['./show-markers.component.css']
})
export class ShowMarkersComponent implements OnInit, OnChanges {
  // Fetch rules
  // If undefined then the fetched markers are not filtered by that property
  @Input() mapId: string | undefined;

  // Show rules
  /* What fields of the marker to show. These are passed as input
     to `showMarker` */
  @Input() showId = true;
  @Input() showTitle = true;
  @Input() showLatLong = true;
  @Input() showMapId = true;

  @Input() showMarker: Action = {
    type: <Type<Component>>ShowMarkerComponent
  };
  @Input() noMarkersToShowText = 'No markers to show';
  markers: Marker[] = [];

  showMarkers;
  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory) {
    this.showMarkers = this;
  }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.fetchMarkers();
  }

  ngOnChanges() {
    this.fetchMarkers();
  }

  fetchMarkers() {
    if (this.gs) {
      this.gs
        .get<{ data: { markers: Marker[] } }>('/graphql', {
          params: {
            query: `
              query Markers($input: MarkersInput!) {
                markers(input: $input) {
                  ${this.showId ? 'id' : ''}
                  ${this.showTitle ? 'title' : ''}
                  ${this.showLatLong ? 'latitude' : ''}
                  ${this.showLatLong ? 'longitude' : ''}
                  ${this.showMapId ? 'mapId' : ''}
                }
              }
            `,
            variables: JSON.stringify({
              input: {
                mapId: this.mapId
              }
            })
          }
        })
        .subscribe((res) => {
          this.markers = res.data.markers;
        });
    }
  }
}
