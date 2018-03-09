import {
  AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnInit,
  Output, SimpleChanges, Type
} from '@angular/core';
import {
  Action, GatewayService, GatewayServiceFactory
} from 'dv-core';
import { RatingService, RatingServiceFactory } from '../shared/rating.service';
import { ShowRatingComponent } from '../show-rating/show-rating.component';


@Component({
  selector: 'rating-show-ratings-by-target',
  templateUrl: './show-ratings-by-target.component.html',
  styleUrls: ['./show-ratings-by-target.component.css']
})
export class ShowRatingsByTargetComponent implements OnInit, OnChanges {
  @Input() targetId: string;
  @Input() showRating: Action = {type: <Type<Component>> ShowRatingComponent};

  @Input() noRatingsToShowText = 'No ratings to show';
  ratings: {rating: number, sourceId: string}[] = [];

  ratingService: RatingService;
  showRatingsByTarget;

  constructor(private elem: ElementRef, private rsf: RatingServiceFactory) {
    this.showRatingsByTarget = this;
  }

  ngOnInit() {
    this.ratingService = this.rsf.for(this.elem);
    this.loadRatings();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.loadRatings();
  }

  async loadRatings() {
    if (!this.targetId || !this.ratingService) {
      return;
    }
    const res = await this.ratingService
      .get<{
        data: {target: {ratings: {rating: number, sourceId: string}[]}}
        }>(`
        target(id: "${this.targetId}") {
          ratings {
            rating
            sourceId
          }
        }
      `)
      .toPromise();
    this.ratings = res.data.target.ratings;
  }
}
