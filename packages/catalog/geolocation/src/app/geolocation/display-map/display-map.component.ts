import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input,
  OnChanges, OnInit, Output
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnEval, RunService
} from 'dv-core';

import { API_PATH, CONFIG } from '../geolocation.config';
import { Marker } from '../shared/geolocation.model';

import { MouseEvent as AgmMouseEvent } from '@agm/core';
import {
  icon, latLng, LeafletMouseEvent, map, Map, marker,
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

  @Input() streetViewControl = false;

  // Default configurations for map displays
  // Default center: MIT Stata Center
  @Input() lat = 42.36157;
  @Input() lng = -71.09067;
  @Input() zoom = 16;
  @Input() maxZoom = 20;
  @Input() minZoom = 3;

  // Default Tile Provider for Leaflet: OpenStreetMaps
  @Input() urlTemplate = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  @Input() attribution = 'Map data &copy; \
   <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, \
   <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>';

  @Output() newPosition: EventEmitter<Marker> = new EventEmitter<Marker>();

  mapType: 'gmap' | 'leaflet';
  markers: Marker[];

  private _myMap: Map;
  private _markers: lMarker[];
  private _markerIcon = {
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
    private rs: RunService, @Inject(API_PATH) private apiPath,
    @Inject(CONFIG) config) {
    this.mapType = config.mapType;
  }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  ngAfterViewInit() {
    if (this.mapType === 'leaflet') { this.setUpMap(); }
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
    this._myMap = map('mapid')
      .setView(latLng(this.lat, this.lng), this.zoom);
    tileLayer(this.urlTemplate, {
      attribution: this.attribution,
      minZoom: this.minZoom,
      maxZoom: this.maxZoom
    })
      .addTo(this._myMap);
    this._myMap.on('click', (event: LeafletMouseEvent) => {
      this.onMapClick(event);
    });
  }

  onMapClick(e) {
    let coords;

    if (this.mapType === 'leaflet') {
      const event: LeafletMouseEvent = e;
      coords = event.latlng;
    } else {
      const event: AgmMouseEvent = e;
      coords = event.coords;
    }

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
        .get<{ data: { markers: Marker[] } }>(this.apiPath, {
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
          if (this.mapType === 'leaflet') {
            _.forEach(this._markers, (m: lMarker) => {
              return this._myMap.removeLayer(m);
            });

            this._markers = _.map(res.data.markers, (m: Marker) => {
              return marker(latLng([m.latitude, m.longitude]), this._markerIcon)
                .bindPopup(`<b>${m.title}</b>`)
                .addTo(this._myMap);
            });
          } else {
            this.markers = res.data.markers;
          }

        });
    }
  }

  private canEval(): boolean {
    return !!(this.gs);
  }
}
