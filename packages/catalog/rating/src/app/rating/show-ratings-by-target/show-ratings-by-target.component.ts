import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject,
  Input, OnChanges, OnInit, Output, SimpleChanges, Type
} from '@angular/core';
import {
  Action, GatewayService, GatewayServiceFactory, OnEval, RunService
} from '@deja-vu/core';

import { API_PATH } from '../rating.config';
import { Rating } from '../shared/rating.model';

import { ShowRatingComponent } from '../show-rating/show-rating.component';

interface RatingsRes {
  data: { ratings: Rating[] };
  errors: { message: string }[];
}

@Component({
  selector: 'rating-show-ratings-by-target',
  templateUrl: './show-ratings-by-target.component.html',
  styleUrls: ['./show-ratings-by-target.component.css']
})
export class ShowRatingsByTargetComponent implements AfterViewInit, OnEval,
OnInit, OnChanges {
  @Input() targetId: string;

  @Input() showRating: Action = { type: <Type<Component>>ShowRatingComponent };

  @Input() noRatingsToShowText = 'No ratings to show';
  ratings: Rating[] = [];

  showRatingsByTarget;
  private gs: GatewayService;

  constructor(private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, @Inject(API_PATH) private apiPath) {
    this.showRatingsByTarget = this;
  }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  ngAfterViewInit() {
    this.loadRatings();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.loadRatings();
  }

  async loadRatings() {
    if (this.canEval()) {
      this.rs.eval(this.elem);
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      this.gs.get<RatingsRes>(this.apiPath, {
        params: {
          inputs: {
            input: {
              ofTargetId: this.targetId
            }
          },
          extraInfo: {
            returnFields: `
              sourceId
              targetId
              rating
            `
          }
        }
      })
      .subscribe((res) => {
        this.ratings = res.data.ratings;
      });
    }
  }

  private canEval(): boolean {
    return !!(this.gs && this.targetId);
  }
}
