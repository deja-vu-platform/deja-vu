import { DatePipe } from '@angular/common';
import {
  AfterViewInit, Component, ElementRef, Inject, Input, OnChanges, OnInit
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnEval, RunService
} from 'dv-core';

import { API_PATH } from '../geolocation.config';
import { Location, Marker } from '../shared/geolocation.model';

@Component({
  selector: 'geolocation-show-marker',
  templateUrl: './show-marker.component.html',
  styleUrls: ['./show-marker.component.css'],
  providers: [DatePipe]
})
export class ShowMarkerComponent implements OnInit, AfterViewInit, OnChanges,
  OnEval {

  @Input() id: string | undefined;
  @Input() marker: Marker | Location | undefined;

  @Input() showId = true;
  @Input() showTitle = true;
  @Input() showLatLong = true;
  @Input() showMapId = true;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, @Inject(API_PATH) private apiPath) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  ngAfterViewInit() {
    this.load();
  }

  ngOnChanges() {
    if (!this.marker) {
      this.load();
    }
  }

  load() {
    if (this.canEval()) {
      this.rs.eval(this.elem);
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      this.gs.get<{ data: any }>(this.apiPath, {
        params: {
          inputs: { id: this.id },
          extraInfo: {
            returnFields: `
              id
              title
              latitude
              longitude
              mapId
            `
          }
        }
      })
        .subscribe((res) => {
          const markerById = res.data.marker;
          if (markerById) {
            this.marker = res.data.marker;
          }
        });
    }
  }

  private canEval(): boolean {
    return !!(this.gs && this.id && !this.marker);
  }
}
