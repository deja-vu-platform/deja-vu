import {
  AfterViewInit, Component, ElementRef, Input, OnChanges, OnInit, Type
} from '@angular/core';
import {
  Action, GatewayService, GatewayServiceFactory, OnEval, RunService
} from '@deja-vu/core';
import * as _ from 'lodash';

import { ShowMarkerComponent } from '../show-marker/show-marker.component';

import { Location, Marker } from '../shared/geolocation.model';


@Component({
  selector: 'geolocation-show-markers',
  templateUrl: './show-markers.component.html',
  styleUrls: ['./show-markers.component.css']
})
export class ShowMarkersComponent implements AfterViewInit, OnEval, OnInit,
  OnChanges {
  // Fetch rules
  @Input() ofMapId: string | undefined;
  @Input() center: Location | undefined;
  @Input() radius: number | undefined;

  // Show rules
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
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService) {
    this.showMarkers = this;
  }

  ngOnInit() {
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

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      const filter = { ofMapId: this.ofMapId };
      if (this.center && this.radius) {
        filter['centerLat'] = this.center.latitude;
        filter['centerLng'] = this.center.longitude;
        filter['radius'] = this.radius;
      }
      this.gs
        .get<{ data: { markers: Marker[] } }>('/graphql', {
          params: {
            inputs: JSON.stringify({ input: filter }),
            extraInfo: {
              returnFields: `
                ${this.showId ? 'id' : ''}
                ${this.showTitle ? 'title' : ''}
                ${this.showLatLong ? 'latitude' : ''}
                ${this.showLatLong ? 'longitude' : ''}
                ${this.showMapId ? 'mapId' : ''}
              `
            }
          }
        })
        .subscribe((res) => {
          this.markers = res.data.markers;
        });
    }
  }

  private canEval(): boolean {
    if (this.center || this.radius) {
      return !!(this.gs && this.center && this.radius);
    } else {
      return !!(this.gs);
    }
  }
}
