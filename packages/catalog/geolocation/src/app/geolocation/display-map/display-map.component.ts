import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, NgZone,
  OnChanges, OnDestroy, OnInit, Output, SimpleChanges
} from '@angular/core';
import { DvService, DvServiceFactory, OnEval } from '@deja-vu/core';

import { MouseEvent as AgmMouseEvent } from '@agm/core';

import 'leaflet';
import 'leaflet-control-geocoder';
import 'leaflet-routing-machine';
declare let L;

import { NavigationEnd, Router, RouterEvent } from '@angular/router';
import { Subject } from 'rxjs/Subject';

import { API_PATH } from '../geolocation.config';
import {
  DEFAULT_MAP_ID, Location, Marker
} from '../shared/geolocation.model';

import * as _ from 'lodash';
import { filter, take, takeUntil } from 'rxjs/operators';


@Component({
  selector: 'geolocation-display-map',
  templateUrl: './display-map.component.html',
  styleUrls: ['./display-map.component.css']
})
export class DisplayMapComponent
  implements AfterViewInit, OnDestroy, OnEval, OnInit, OnChanges {
  // A list of fields to wait for
  @Input() waitOn: string[] = [];

  public options: L.MapOptions;
  public bounds: L.LatLngBounds;
  public layers: L.Layer[];
  public mapType: 'gmap' | 'leaflet' | undefined;

  private _markers: Marker[];
  private _markerIds: string[];
  private _map: L.Map;
  private _geocoder: any;
  private _geocodeMarker: L.Marker;
  private _markerIcon = L.icon({
    iconSize: [25, 41],
    iconAnchor: [13, 41],
    iconUrl: 'assets/geolocation/marker-icon.png',
    shadowUrl: 'assets/geolocation/marker-shadow.png'
  });

  @Input() id = DEFAULT_MAP_ID;

  @Input() expectMarkers = false;
  // If not provided, all markers associated with `id` will be loaded
  get markers() { return this._markers; }
  @Input() set markers(markers: Marker[]) {
    if (!_.isEmpty(markers)) {
      const filtered = _.filter(markers, (m) => !_.isNil(m));
      if (!_.isEmpty(filtered)) {
        this._markers = filtered;
        if (this.mapType !== 'gmap') {
          this.setLeafletMarkers();
        }
      }
    }
  }

  get markersIds() { return this._markerIds; }
  @Input() set markerIds(markerIds: string[]) {
    this._markerIds = markerIds;
  }

  // Filter points by radius in miles
  @Input() center: Location | undefined;
  @Input() radius: number | undefined;

  // Used to show directions between two points
  @Input() start: Location | undefined; // N/A for Google Maps
  @Input() end: Location | undefined;   // N/A for Google Maps

  // Presentation Inputs
  @Input() showLoadedMarkers = true;
  @Input() showSearchControl = true;      // N/A for Google Maps
  @Input() showDirectionsControl = true;  // N/A for Google Maps
  @Input() streetViewControl = false;     // N/A for Leaflet

  // Default configurations for map displays
  // Default center: MIT Stata Center
  @Input() lat = 42.36157;
  @Input() lng = -71.09067;
  @Input() zoom = 16;
  @Input() maxZoom = 19;
  @Input() minZoom = 3;

  // Default Tile Provider for Leaflet: OpenStreetMaps
  @Input() urlTemplate = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  @Input() attribution = 'Map data &copy; \
    <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, \
    <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>';

  @Output() newMarker: EventEmitter<Marker> = new EventEmitter<Marker>();

  private dvs: DvService;

  constructor(
    private readonly elem: ElementRef, private readonly dvf: DvServiceFactory,
    private readonly zone: NgZone,
    @Inject(API_PATH) private readonly apiPath) {}

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .withDefaultWaiter()
      .withRefreshCallback(() => {
        this.newMarker.emit(null);
        if (this.mapType !== 'gmap') {
          this.setUpLeafletMap();
        }
        this.load();
      })
      .build();

    this.mapType = _.get(this.dvs.config.getConfig(), 'mapType');
    if (this.mapType !== 'gmap') {
      this.setUpLeafletMap();
    }
  }

  ngAfterViewInit() {
    this.load();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.dvs && this.dvs.waiter.processChanges(changes)) {
      this.load();
    }
  }

  load() {
    if (this.canEval()) {
      this.dvs.eval();
    }
  }

  setUpLeafletMap() {
    L.Marker.prototype.options.icon = this._markerIcon;

    // Set the initial set of displayed layers
    this.options = {
      layers: [L.tileLayer(this.urlTemplate, {
        attribution: this.attribution,
        minZoom: this.minZoom,
        maxZoom: this.maxZoom
      })],
      zoom: this.zoom,
      center: L.latLng([this.lat, this.lng])
    };

    this._geocoder = L.Control.Geocoder.nominatim();
  }

  setLeafletMarkers() {
    if (this.showLoadedMarkers) {
      this.layers = this.markers.map((m: Marker) => {
        const popupText = m.title ? m.title : `${m.latitude}, ${m.longitude}`;

        return L.marker([m.latitude, m.longitude], {
          icon: this._markerIcon
        })
          .bindPopup(`<b>${popupText}</b>`);
      });

      this.bounds = (L.featureGroup(this.layers)).getBounds()
        .pad(0.5);
    }
  }

  setUpLeafletSearchControl() {
    L.Control.geocoder({
      geocoder: this._geocoder,
      position: 'topleft'
    })
      .on('markgeocode', (e) => {
        const m: Marker = {
          title: e.geocode.name,
          latitude: e.geocode.center.lat,
          longitude: e.geocode.center.lng,
          mapId: this.id
        };
        this.newMarker.emit(m);
      })
      .addTo(this._map);
  }

  setUpLeafletDirectionsControl() {
    const routingOptions = {
      routeWhileDragging: true,
      reverseWaypoints: true,
      showAlternatives: true,
      altLineOptions: {
        styles: [
          { color: 'black', opacity: 0.15, weight: 9 },
          { color: 'white', opacity: 0.8, weight: 6 },
          { color: 'blue', opacity: 0.5, weight: 2 }
        ]
      },
      geocoder: this._geocoder
    };

    // Display route for given points
    if (this.start && this.end) {
      routingOptions['waypoints'] = [
        L.latLng(this.start.latitude, this.start.longitude),
        L.latLng(this.end.latitude, this.end.longitude)
      ];
    }

    L.Routing.control(routingOptions)
      .addTo(this._map);
  }

  // Leaflet only
  onMapReady(map: L.Map) {
    this._map = map;

    // search
    if (this.showSearchControl) {
      this.setUpLeafletSearchControl();
    }

    // directions between two or more points
    // (the points are either provided from the UI or inputted as start and end)
    if (this.showDirectionsControl) {
      this.setUpLeafletDirectionsControl();
    }

    // click handler
    this._map.on('click', (e) => this.zone.run(() => this.onMapClick(e)));
  }

  onMapClick(e) {
    if (this.mapType !== 'gmap') {
      const event: L.LeafletMouseEvent = e;
      const coords = event.latlng;

      // Retrieve address from clicked location
      this._geocoder.reverse(coords,
        this._map.options.crs.scale(this._map.getZoom()), (results) => {
          const r = results[0];
          const title = r.html || r.name;

          this.newMarker.emit(
            this.generateMarker(coords.lat, coords.lng, r.name));

          if (this._geocodeMarker) {
            this._map.removeLayer(this._geocodeMarker);
          }
          this._geocodeMarker = L.marker(coords, { icon: this._markerIcon })
            .bindPopup(title)
            .addTo(this._map)
            .openPopup();
        });
    } else {
      const event: AgmMouseEvent = e;
      const coords = event.coords;
      this.newMarker.emit(this.generateMarker(coords.lat, coords.lng));
    }
  }

  private generateMarker(lat: number, lng: number, title?: string): Marker {
    return {
      title: title,
      latitude: lat,
      longitude: lng,
      mapId: this.id
    };
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      const res = await this.dvs
        .waitAndGet<{ data: { markers: Marker[] } }>(this.apiPath, () => {
          const f = { ofMapId: this.id };
          if (this.center && this.radius) {
            f['centerLat'] = this.center.latitude;
            f['centerLng'] = this.center.longitude;
            f['radius'] = this.radius;
          }
          if (!_.isNil(this._markerIds)) {
            f['markerIds'] = this._markerIds;
          }

          return {
            params: {
              inputs: JSON.stringify({ input: f }),
              extraInfo: {
                returnFields: `
                  title
                  latitude
                  longitude
                `
              }
            }
          };
        });
      this.markers = res.data.markers;
    }
  }

  ngOnDestroy(): void {
    this.dvs.onDestroy();
  }

  private canEval(): boolean {
    if (this.expectMarkers) {
      return false;
    } else if (this.center || this.radius) {
      return !!(this.id && this.dvs && this.center && this.radius);
    } else {
      return !!(this.id && this.dvs);
    }
  }
}
