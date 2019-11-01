import {
  AfterViewInit, Component, ElementRef, Inject, Input, OnChanges,
  OnInit
} from '@angular/core';
import { DvService, DvServiceFactory, OnEval } from '@deja-vu/core';
import { map } from 'rxjs/operators';

import { API_PATH } from '../geolocation.config';
import { Location } from '../shared/geolocation.model';

import * as _ from 'lodash';

interface MarkerCountRes {
  data: { markerCount: number };
}

@Component({
  selector: 'geolocation-show-marker-count',
  templateUrl: './show-marker-count.component.html'
})
export class ShowMarkerCountComponent
  implements AfterViewInit, OnChanges, OnEval, OnInit {
  markerCount: number;

  @Input() ofMapId: string | undefined;
  @Input() center: Location | undefined;
  @Input() radius: number | undefined;

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
    this.load();
  }

  load() {
    if (this.canEval()) {
      this.dvs.eval();
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
      const res = await this.dvs.get<MarkerCountRes>(this.apiPath, {
        params: {
          inputs: JSON.stringify({ input: filter })
        }
      });
      this.markerCount = res.data.markerCount;
    } else if (this.dvs) {
      this.dvs.noRequest();
    }
  }

  private canEval(): boolean {
    return !!(this.dvs);
  }
}
