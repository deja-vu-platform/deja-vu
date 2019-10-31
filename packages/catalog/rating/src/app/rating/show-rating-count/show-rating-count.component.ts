import {
  AfterViewInit, Component, ElementRef, Inject, Input, OnChanges,
  OnInit
} from '@angular/core';
import { DvService, DvServiceFactory, OnEval } from '@deja-vu/core';

import { API_PATH } from '../rating.config';

import * as _ from 'lodash';

interface RatingCountRes {
  data: { ratingCount: number };
}

@Component({
  selector: 'rating-show-rating-count',
  templateUrl: './show-rating-count.component.html'
})
export class ShowRatingCountComponent
  implements AfterViewInit, OnChanges, OnEval, OnInit {
  ratingCount: number;

  @Input() bySourceId: string | undefined;
  @Input() ofTargetId: string | undefined;

  private dvs: DvService;

  constructor(
    private readonly elem: ElementRef, private readonly dvf: DvServiceFactory,
    @Inject(API_PATH) private readonly apiPath) {}

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
      const res = await this.dvs.get<RatingCountRes>(this.apiPath, {
        params: {
          inputs: JSON.stringify({
            input: {
              bySourceId: this.bySourceId,
              ofTargetId: this.ofTargetId
            }
          })
        }
      });
      this.ratingCount = res.data.ratingCount;
    } else if (this.dvs) {
      this.dvs.noRequest();
    }
  }

  private canEval(): boolean {
    return !!(this.dvs);
  }
}
