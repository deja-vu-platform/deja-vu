import {
  Component, AfterViewInit, ElementRef, Input, OnInit, Output,
  EventEmitter, ViewChild, OnChanges, SimpleChanges
} from '@angular/core';
import { GatewayServiceFactory, GatewayService } from 'dv-core';
import { RatingService, RatingServiceFactory } from '../shared/rating.service';


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

  ratingService: RatingService;

  constructor(private elem: ElementRef, private rsf: RatingServiceFactory) {}

  ngOnInit() {
    this.ratingService = this.rsf.for(this.elem);
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
  async loadRatingAverage() {
    if (!this.targetId || !this.ratingService) {
      return;
    }
    const { rating, count } = await this.ratingService
      .averageRatingForTarget(this.targetId);
    this.averageRatingValue = rating;
    this.averageRating.emit(this.averageRatingValue);

    this.ratingCountValue = count;
    this.ratingCount.emit(this.ratingCountValue);
  }
}
