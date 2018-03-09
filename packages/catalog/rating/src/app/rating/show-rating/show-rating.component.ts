import {
  AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnInit,
  Output, SimpleChanges, Type
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory
} from 'dv-core';
import { RatingService, RatingServiceFactory } from '../shared/rating.service';

import { take } from 'rxjs/operators';

import * as _ from 'lodash';


@Component({
  selector: 'rating-show-rating',
  templateUrl: './show-rating.component.html',
  styleUrls: ['./show-rating.component.css']
})
export class ShowRatingComponent implements
  OnInit, OnChanges {
    // Either (`sourceId`, `targetId`) or `ratingIn` must be given. If
    // `ratingIn` is given this rating is displayed
  @Input() sourceId: string;
  @Input() targetId: string;

  @Input() ratingIn: number;

  @Output() rating = new EventEmitter<number>();

  ratingValue: number;
  private ratingService: RatingService;

  constructor(private elem: ElementRef, private rsf: RatingServiceFactory) {}

  ngOnInit() {
    this.ratingService = this.rsf.for(this.elem);
    this.loadRating();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.loadRating();
  }

  /**
   * Load a rating from the server (if any), and set the value of the widget.
   */
  async loadRating() {
    if (!this.ratingService) {
      return;
    }
    if (this.ratingIn) {
      this.ratingValue = this.ratingIn;
      this.rating.emit(this.ratingValue);
    } else if (this.sourceId && this.targetId) {
      this.ratingValue = await this.ratingService
        .ratingBySourceTarget(this.sourceId, this.targetId);
      this.rating.emit(this.ratingValue);
    }
  }
}
