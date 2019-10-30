import {
  AfterViewInit, Component, ElementRef, Inject, Input, OnChanges,
  OnInit
} from '@angular/core';
import { DvService, DvServiceFactory, OnEval } from '@deja-vu/core';
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
export class ShowEventCountComponent
  implements AfterViewInit, OnChanges, OnEval, OnInit {
  eventCount: number;
  // TODO
  @Input() startDateFilter: any;
  @Input() endDateFilter: any;

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
      const res = await this.dvs.get<EventCountRes>(this.apiPath, {
        params: {
          inputs: JSON.stringify({
            input: {
              startDate: this.startDateFilter,
              endDate: this.endDateFilter
            }
          })
        }
      });
      this.eventCount = res.data.eventCount;
    } else if (this.dvs) {
      this.dvs.noRequest();
    }
  }

  private canEval(): boolean {
    return !!(this.dvs);
  }
}
