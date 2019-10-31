import { DatePipe } from '@angular/common';
import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnChanges,
  OnInit, Output
} from '@angular/core';
import { DvService, DvServiceFactory, OnEval } from '@deja-vu/core';

import { API_PATH } from '../geolocation.config';
import { Location, Marker } from '../shared/geolocation.model';

@Component({
  selector: 'geolocation-show-marker',
  templateUrl: './show-marker.component.html',
  styleUrls: ['./show-marker.component.css'],
  providers: [DatePipe]
})
export class ShowMarkerComponent
  implements OnInit, AfterViewInit, OnChanges, OnEval {
  @Input() id: string | undefined;
  @Input() marker: Marker | Location | undefined;

  @Input() showId = true;
  @Input() showTitle = true;
  @Input() showLatLong = true;
  @Input() showMapId = true;

  @Output() loadedMarker = new EventEmitter<Marker | Location>();

  private dvs: DvService;

  constructor(
    private readonly elem: ElementRef, private readonly dvf: DvServiceFactory,
    @Inject(API_PATH) private readonly apiPath) { }

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .build();
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
      this.dvs.eval();
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      const res = await this.dvs.get<{ data: any }>(this.apiPath, {
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
      });
      const markerById = res.data.marker;
      if (markerById) {
        this.marker = res.data.marker;
        this.loadedMarker.emit(this.marker);
      }
    } else if (this.dvs) {
      this.dvs.noRequest();
    }
  }

  private canEval(): boolean {
    return !!(this.dvs && this.id && !this.marker);
  }
}
