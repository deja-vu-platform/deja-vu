import {Component, Input, Output, EventEmitter, NgZone, ElementRef, Inject } from '@angular/core';
import * as L from 'leaflet';
import { MouseEvent as AgmMouseEvent } from '@agm/core';

import { Marker } from '../shared/geolocation.model';
import { GatewayService, GatewayServiceFactory, RunService } from 'dv-core';
import { API_PATH, CONFIG } from '../geolocation.config';

@Component({
  selector: 'geolocation-test-map',
  templateUrl: './test-map.component.html',
  styleUrls: ['./test-map.component.css']
})
export class TestMapComponent {
  public options: L.MapOptions;
  public bounds: L.LatLngBounds;
  public layers: L.Layer[];
  public mapType: 'gmap' | 'leaflet';

  private markerIcon = L.icon({
    iconSize: [25, 41],
    iconAnchor: [13, 41],
    iconUrl: 'leaflet/images/marker-icon.png',
    shadowUrl: 'leaflet/images/marker-shadow.png'
  });

  // Required
  @Input() id: string;

  _markers: Marker[];
  get markers() { return this._markers };
  @Input() set markers(markers: Marker[]) {
    this._markers = markers;
  }

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

  @Output() newMarker: EventEmitter<Marker> = new EventEmitter<Marker>();

  // TODO: give size option

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, private zone: NgZone,
    @Inject(API_PATH) private apiPath,
    @Inject(CONFIG) private config) {
    this.mapType = this.config.mapType;
  }

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
    // Set the initial set of displayed layers
    this.options = {
      layers: [ L.tileLayer(this.urlTemplate, {
        attribution: this.attribution,
        minZoom: this.minZoom,
        maxZoom: this.maxZoom
      })],
      zoom: this.zoom,
      center: L.latLng([ this.lat, this.lng ])
    };
  }

  setMarkers() {
    if (this.markers) {
      this.layers = this.markers.map((m: Marker) => {
        return L.marker(L.latLng([m.latitude, m.longitude]), {
          icon: this.markerIcon,
          title: m.title
        });
        // .bindPopup(`<b>${m.title}</b>`);
      })
    }
  }

  onMapReady(map: L.Map) {
    map.on('click', (e) => this.onMapClick(e));
  }

  onMapClick(e) {
    let coords;

    if (this.mapType === 'leaflet') {
      const event: L.LeafletMouseEvent = e;
      coords = event.latlng;
    } else {
      const event: AgmMouseEvent = e;
      coords = event.coords;
    }

    const m: Marker = {
      latitude: coords.lat,
      longitude: coords.lng,
      mapId: this.id
    };

    this.newMarker.emit(m);
    console.log(JSON.stringify(m));
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
          // this.markers = res.data.markers;
          // if (this.mapType === 'leaflet') {
          //   this.setMarkers();
          // }
        });
    }
  }

  private canEval(): boolean {
    return !!(this.id && this.gs);
  }
}
