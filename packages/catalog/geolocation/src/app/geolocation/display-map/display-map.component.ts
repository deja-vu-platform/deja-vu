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
export class DisplayMapComponent {
  @Input() mapId: string; // TODO


  // Default configurations for the Google Maps Display
  // Default center: MIT Lobby 7
  @Input() lat = 42.3592;
  @Input() lng = -71.09315;
  @Input() zoom = 16;
  @Input() maxZoom = 20;
  @Input() minZoom = 3;
  @Input() streetViewControl = false;
  @Input() draggableMarker = true;

  @Output() newPosition: EventEmitter<Marker> = new EventEmitter<Marker>();

  markers: Marker[];

  mapClicked($event: MouseEvent) {
    console.log(`Marker location: ${$event.coords.lat}, ${$event.coords.lng}`);
    const m: Marker = {
      latitude: $event.coords.lat,
      longitude: $event.coords.lat,
      mapId: this.mapId
    };
    this.newPosition.emit(m);
  }

  clickedMarker(label: string, index: number) {
    console.log(`clicked the marker: ${label || index}`);
  }

  markerDragEnd(m: Marker, $event: MouseEvent) {
    console.log('dragEnd', m, $event);
  }
}
