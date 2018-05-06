import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject,
  Input, OnChanges, OnInit, Output, SimpleChanges, Type
} from '@angular/core';
import { GatewayService, GatewayServiceFactory } from 'dv-core';

import { API_PATH } from '../rating.config';
import { Rating } from '../shared/rating.model';

interface AverageRatingForInputRes {
  data: { averageRatingForTarget: { rating: number; count: number } };
  errors: { message: string }[];
}

@Component({
  selector: 'rating-show-average-rating',
  templateUrl: './show-average-rating.component.html',
  styleUrls: ['./show-average-rating.component.css']
})
export class ShowAverageRatingComponent implements OnInit, OnChanges {
  @Input() targetId: string;

  @Output() averageRating = new EventEmitter<number>();
  averageRatingValue: number;

  @Output() ratingCount = new EventEmitter<number>();
  ratingCountValue = 0;

  private gs: GatewayService;

  constructor(private elem: ElementRef, private gsf: GatewayServiceFactory,
    @Inject(API_PATH) private apiPath) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.loadRatingAverage();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.targetId || changes.newTargetId) {
      this.loadRatingAverage();
    }
  }

  /**
   * Download ratings for the target from the server.
   */
  loadRatingAverage() {
    if (!this.targetId || !this.gs) {
      return;
    }

    this.gs.get<AverageRatingForInputRes>(this.apiPath, {
      params: {
        query: `
          query {
            averageRatingForTarget(targetId: "${this.targetId}")
          }
        `
      }
    })
      .subscribe((res) => {
        if (res.data.averageRatingForTarget) {
          this.averageRatingValue = res.data.averageRatingForTarget.rating;
          this.averageRating.emit(this.averageRatingValue);
          this.ratingCountValue = res.data.averageRatingForTarget.count;
          this.ratingCount.emit(this.ratingCountValue);
        }
      });
  }
}
