import {
  AfterViewInit, Component, ElementRef, Inject, Input, OnChanges,
  OnInit
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnEval, RunService
} from '@deja-vu/core';
import { map } from 'rxjs/operators';

import { API_PATH } from '../geolocation.config';
import { Location, Marker } from '../shared/geolocation.model';

import * as _ from 'lodash';

interface MarkerCountRes {
  data: { markerCount: number };
}

@Component({
  selector: 'geolocation-show-marker-count',
  templateUrl: './show-marker-count.component.html'
})
export class ShowMarkerCountComponent implements AfterViewInit, OnChanges,
  OnEval, OnInit {
  public markerCount: number;

  @Input() ofMapId: string | undefined;
  @Input() center: Location | undefined;
  @Input() radius: number | undefined;

  @Input() markerIds: string[] | undefined;
  @Input() set marker(value: Marker[]) {
    this.markerIds = _.map(value, 'id');
  }

  private gs: GatewayService;

  constructor(
    private elem: ElementRef,
    private gsf: GatewayServiceFactory,
    private rs: RunService,
    @Inject(API_PATH) private apiPath) { }

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
    } else {
      this.markerCount = this.markerIds.length;
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
      this.gs.get<MarkerCountRes>(this.apiPath, {
        params: {
          inputs: { input: filter }
        }
      })
        .pipe(map((res: MarkerCountRes) => res.data.markerCount))
        .subscribe((markerCount) => {
          this.markerCount = markerCount;
        });
    }
  }

  private canEval(): boolean {
    return !!(!this.markerIds && this.gs);
  }
}
