import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, NgZone,
  OnChanges, OnInit, Output
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnEval, RunService
} from 'dv-core';

import { MouseEvent as AgmMouseEvent } from '@agm/core';

import 'leaflet';
import 'leaflet-control-geocoder';
import 'leaflet-routing-machine';
declare let L;

import { API_PATH, CONFIG } from '../geolocation.config';
import { Location, Marker } from '../shared/geolocation.model';


@Component({
  selector: 'geolocation-display-map',
  templateUrl: './display-map.component.html',
  styleUrls: ['./display-map.component.css']
})
export class DisplayMapComponent implements AfterViewInit, OnEval, OnInit,
  OnChanges {
  public options: L.MapOptions;
  public bounds: L.LatLngBounds;
  public layers: L.Layer[];
  public mapType: 'gmap' | 'leaflet';

  private _markers: Marker[];
  private _map: L.Map;
  private _geocoder: any;
  private _geocodeMarker: L.Marker;
  private _markerIcon = L.icon({
    iconSize: [25, 41],
    iconAnchor: [13, 41],
    iconUrl: 'assets/leaflet/images/marker-icon.png',
    shadowUrl: 'assets/leaflet/images/marker-shadow.png'
  });

  // Required
  @Input() id: string;

  // If not provided, all markers will be loaded
  get markers() { return this._markers; }
  @Input() set markers(markers: Marker[]) {
    this._markers = markers;
  }

  @Input() start: Location; // N/A for Google Maps
  @Input() end: Location;   // N/A for Google Maps

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
  @Input() maxZoom = 20;
  @Input() minZoom = 3;

  // Default Tile Provider for Leaflet: OpenStreetMaps
  @Input() urlTemplate = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  @Input() attribution = 'Map data &copy; \
    <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, \
    <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>';

  @Output() newMarker: EventEmitter<Marker> = new EventEmitter<Marker>();

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, private zone: NgZone,
    @Inject(API_PATH) private apiPath, @Inject(CONFIG) private config) {
    this.mapType = this.config.mapType;
  }

  ngOnInit() {
    if (this.mapType === 'leaflet') { this.setUpLeafletMap(); }
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
    if (this.markers) {
      this.layers = this.markers.map((m: Marker) => {
        return L.marker([m.latitude, m.longitude], {
          icon: this._markerIcon
        })
          .bindPopup(`<b>${m.title}</b>`);
      });
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
    let coords, title;

    if (this.mapType === 'leaflet') {
      const event: L.LeafletMouseEvent = e;
      coords = event.latlng;

      // Retrieve address from clicked location
      this._geocoder.reverse(coords,
        this._map.options.crs.scale(this._map.getZoom()), (results) => {
          const r = results[0];
          title = r.html || r.name;
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
      coords = event.coords;
    }

    const m: Marker = {
      title: title,
      latitude: coords.lat,
      longitude: coords.lng,
      mapId: this.id
    };

    this.newMarker.emit(m);
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
                ofMapId: this.id
              }
            }
          }
        })
        .subscribe((res) => {
          this.markers = res.data.markers;
          if (this.mapType === 'leaflet') {
            this.setLeafletMarkers();
          }
        });
    }
  }

  private canEval(): boolean {
    return !!(this.id && this.gs);
  }
}
