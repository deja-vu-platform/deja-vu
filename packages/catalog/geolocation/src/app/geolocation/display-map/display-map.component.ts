import { MouseEvent } from '@agm/core';
import {
  Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output
} from '@angular/core';
import { Marker } from '../shared/geolocation.model';

import { GatewayService, GatewayServiceFactory } from 'dv-core';

import * as _ from 'lodash';

@Component({
  selector: 'geolocation-display-map',
  templateUrl: './display-map.component.html',
  styleUrls: ['./display-map.component.css']
})
export class DisplayMapComponent implements OnInit, OnChanges {
  @Input() id: string;


  // Default configurations for the Google Maps Display
  // Default center: MIT Stata Center
  @Input() lat = 42.3616423;
  @Input() lng = -71.0928587;
  @Input() zoom = 16;
  @Input() maxZoom = 20;
  @Input() minZoom = 3;
  @Input() streetViewControl = false;
  @Input() draggableMarker = false;

  @Output() newPosition: EventEmitter<Marker> = new EventEmitter<Marker>();

  markers: Marker[] = [];

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory) { }

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
                  title
                  latitude
                  longitude
                }
              }
            `,
            variables: JSON.stringify({
              input: {
                mapId: this.id
              }
            })
          }
        })
        .subscribe((res) => {
          this.markers = res.data.markers;
        });
    }
  }

  mapClicked($event: MouseEvent) {
    console.log(`Marker location: ${$event.coords.lat}, ${$event.coords.lng}`);
    const m: Marker = {
      latitude: $event.coords.lat,
      longitude: $event.coords.lng,
      mapId: this.id
    };
    this.newPosition.emit(m);
  }

  clickedMarker(title: string) {
    console.log(`clicked the marker: ${title}`);
  }

  markerDragEnd(m: Marker, $event: MouseEvent) {
    console.log('dragEnd', m, $event);
  }
}