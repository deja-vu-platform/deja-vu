import {
  AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnInit,
  Output
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnEval, RunService
} from 'dv-core';

import { Marker } from '../shared/geolocation.model';

import {
  icon, latLng, LatLng, LeafletMouseEvent, map, Map, marker,
  Marker as lMarker, tileLayer
} from 'leaflet';
import * as _ from 'lodash';

@Component({
  selector: 'geolocation-display-map',
  templateUrl: './display-map.component.html',
  styleUrls: ['./display-map.component.css']
})
export class DisplayMapComponent implements AfterViewInit, OnEval, OnInit,
  OnChanges {
  // Required
  @Input() displayMapId: string;

  // Default configurations for Leaflet.js
  // Default center: MIT Stata Center
  @Input() lat = 42.36157;
  @Input() lng = -71.09067;
  @Input() zoom = 16;
  @Input() maxZoom = 20;
  @Input() minZoom = 3;

  // Default Tile Provider: OpenStreetMaps
  @Input() urlTemplate = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  @Input() attribution = 'Map data &copy; \
   <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, \
   <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>';

  @Output() newPosition: EventEmitter<Marker> = new EventEmitter<Marker>();

  private myMap: Map;
  private markers: lMarker[];
  private markerIcon = {
    icon: icon({
      iconSize: [25, 41],
      iconAnchor: [13, 41],
      iconUrl: '../assets/img/marker-icon.png',
      shadowUrl: '../assets/img/marker-shadow.png'
    })
  };

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService) { }

  ngOnInit() {
    this.setUpMap();
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  ngAfterViewInit() {
    this.load();
  }

  ngOnChanges() {
    this.load();
  }

  load() {
    if (this.canEval()) {
      this.rs.eval(this.elem);
    }
  }

  setUpMap() {
    // Do NOT change 'mapid'
    this.myMap = map('mapid')
      .setView(latLng(this.lat, this.lng), this.zoom);
    tileLayer(this.urlTemplate, {
      attribution: this.attribution,
      minZoom: this.minZoom,
      maxZoom: this.maxZoom
    })
      .addTo(this.myMap);
    this.myMap.on('click', (event: LeafletMouseEvent) => {
      this.onMapClick(event);
    });
  }

  onMapClick(e: LeafletMouseEvent) {
    const coords: LatLng = e.latlng;
    const m: Marker = {
      latitude: coords.lat,
      longitude: coords.lng,
      mapId: this.displayMapId
    };
    this.newPosition.emit(m);
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
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
            variables: {
              input: {
                ofMapId: this.displayMapId
              }
            }
          }
        })
        .subscribe((res) => {
          _.forEach(this.markers, (m: lMarker) => this.myMap.removeLayer(m));

          this.markers = _.map(res.data.markers, (m: Marker) => {
            return marker(latLng([m.latitude, m.longitude]), this.markerIcon)
              .bindPopup(`<b>${m.title}</b>`)
              .addTo(this.myMap);
          });
        });
    }
  }

  private canEval(): boolean {
    return !!(this.gs);
  }
}
