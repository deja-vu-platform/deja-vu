import {
  AfterViewInit, Component, ElementRef, Inject, Input, OnChanges,
  OnInit
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnEval, RunService
} from '@deja-vu/core';
import { map } from 'rxjs/operators';

import { API_PATH } from '../event.config';
import { Event } from '../shared/event.model';

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
  public eventCount: number;
  // TODO
  @Input() startDateFilter: any;
  @Input() endDateFilter: any;

  @Input() eventIds: string[] | undefined;
  @Input() set events(value: Event[]) {
    this.eventIds = _.map(value, 'id');
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
      this.eventCount = this.eventIds.length;
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      this.gs.get<EventCountRes>(this.apiPath, {
        params: {
          inputs: {
            input: {
              startDate: this.startDateFilter,
              endDate: this.endDateFilter
            }
          }
        }
      })
        .pipe(map((res: EventCountRes) => res.data.eventCount))
        .subscribe((eventCount) => {
          this.eventCount = eventCount;
        });
    }
  }

  private canEval(): boolean {
    return !!(!this.eventIds && this.gs);
  }
}
