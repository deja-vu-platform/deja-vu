import {
  AfterViewInit, Component, ElementRef, Inject, Input, OnChanges,
  OnInit
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnEval, RunService
} from '@deja-vu/core';
import { map } from 'rxjs/operators';

import { API_PATH } from '../rating.config';
import { Rating } from '../shared/rating.model';

import * as _ from 'lodash';

interface RatingCountRes {
  data: { ratingCount: number };
}

@Component({
  selector: 'rating-show-rating-count',
  templateUrl: './show-rating-count.component.html'
})
export class ShowRatingCountComponent implements AfterViewInit, OnChanges,
  OnEval, OnInit {
  public ratingCount: number;

  @Input() bySourceId: string | undefined;
  @Input() ofTargetId: string | undefined;

  @Input() ratingIds: string[] | undefined;
  @Input() set rating(value: Rating[]) {
    this.ratingIds = _.map(value, 'id');
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
      this.ratingCount = this.ratingIds.length;
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      this.gs.get<RatingCountRes>(this.apiPath, {
        params: {
          inputs: {
            input: {
              bySourceId: this.bySourceId,
              ofTargetId: this.ofTargetId
            }
          }
        }
      })
        .pipe(map((res: RatingCountRes) => res.data.ratingCount))
        .subscribe((ratingCount) => {
          this.ratingCount = ratingCount;
        });
    }
  }

  private canEval(): boolean {
    return !!(!this.ratingIds && this.gs);
  }
}
