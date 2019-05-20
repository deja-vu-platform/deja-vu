import {
  AfterViewInit, Component, ElementRef, Inject, Input, OnChanges,
  OnInit
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnEval, RunService
} from '@deja-vu/core';
import { map } from 'rxjs/operators';

import { API_PATH } from '../event.config';

import * as _ from 'lodash';

interface EventCountRes {
  data: { eventCount: number };
}

@Component({
  selector: 'event-show-event-count',
  templateUrl: './show-event-count.component.html'
})
export class ShowEventCountComponent implements AfterViewInit, OnChanges,
  OnEval, OnInit {
  eventCount: number;
  // TODO
  @Input() startDateFilter: any;
  @Input() endDateFilter: any;

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
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      this.gs.get<EventCountRes>(this.apiPath, {
        params: {
          inputs: JSON.stringify({
            input: {
              startDate: this.startDateFilter,
              endDate: this.endDateFilter
            }
          })
        }
      })
        .pipe(map((res: EventCountRes) => res.data.eventCount))
        .subscribe((eventCount) => {
          this.eventCount = eventCount;
        });
    } else if (this.gs) {
      this.gs.noRequest();
    }
  }

  private canEval(): boolean {
    return !!(this.gs);
  }
}
