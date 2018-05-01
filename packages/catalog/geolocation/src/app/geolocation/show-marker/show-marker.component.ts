import { DatePipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Marker } from '../shared/geolocation.model';

@Component({
  selector: 'geolocation-show-marker',
  templateUrl: './show-marker.component.html',
  styleUrls: ['./show-marker.component.css'],
  providers: [DatePipe]
})
export class ShowMarkerComponent {
  @Input() marker: Marker;

  @Input() showId = true;
  @Input() showTitle = true;
  @Input() showLatLong = true;
  @Input() showMapId = true;
}
