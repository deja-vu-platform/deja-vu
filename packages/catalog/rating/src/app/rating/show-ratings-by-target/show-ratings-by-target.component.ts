import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject,
  Input, OnChanges, OnInit, Output, SimpleChanges, Type
} from '@angular/core';
import { Action, GatewayService, GatewayServiceFactory } from 'dv-core';

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
export class ShowRatingsByTargetComponent implements OnInit, OnChanges {
  @Input() targetId: string;
  @Input() showRating: Action = { type: <Type<Component>>ShowRatingComponent };

  @Input() noRatingsToShowText = 'No ratings to show';
  ratings: Rating[] = [];

  showRatingsByTarget;
  private gs: GatewayService;

  constructor(private elem: ElementRef, private gsf: GatewayServiceFactory,
    @Inject(API_PATH) private apiPath) {
    this.showRatingsByTarget = this;
  }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.loadRatings();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.loadRatings();
  }

  async loadRatings() {
    if (!this.targetId || !this.gs) {
      return;
    }
    this.gs.get<RatingsRes>(this.apiPath, {
      params: {
        query: `
          query Ratings($input: RatingsInput!) {
            ratings(input: $input) {
              rating
            }
          }
        `,
        variables: JSON.stringify({
          input: {
            ofTargetId: this.targetId
          }
        })
      }
    })
      .subscribe((res) => {
        this.ratings = res.data.ratings;
      });
  }
}
