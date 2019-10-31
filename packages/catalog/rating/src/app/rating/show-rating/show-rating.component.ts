import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject,
  Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges
} from '@angular/core';
import { DvService, DvServiceFactory, OnEval } from '@deja-vu/core';

import { API_PATH } from '../rating.config';
import { Rating } from '../shared/rating.model';

import * as _ from 'lodash';


interface RatingRes {
  data: { rating: Rating };
  errors: { message: string }[];
}

@Component({
  selector: 'rating-show-rating',
  templateUrl: './show-rating.component.html',
  styleUrls: ['./show-rating.component.css']
})
export class ShowRatingComponent
  implements AfterViewInit, OnDestroy, OnEval, OnInit, OnChanges {
  @Input() waitOn: string[];
  // Either (`sourceId`, `targetId`), `rating` or `ratingIn` must be given.
  // If `rating` or `ratingIn` is given, this rating is displayed
  @Input() sourceId: string;
  @Input() targetId: string;

  @Input() rating: Rating;

  @Input() ratingIn: number;

  // Presentation inputs
  @Input() showStars = true;

  @Output() loadedRating = new EventEmitter<Rating>();
  @Output() errors = new EventEmitter<any>();

  ratingValue: number;
  private dvs: DvService;

  constructor(
    private readonly elem: ElementRef, private readonly dvf: DvServiceFactory,
    @Inject(API_PATH) private readonly apiPath) { }

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .withDefaultWaiter()
      .withRefreshCallback(() => { this.load(); })
      .build();
  }

  ngAfterViewInit() {
    this.load();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.dvs && this.dvs.waiter.processChanges(changes)) {
      this.load();
    }
  }

  /**
   * Load a rating from the server (if any), and set the value of the widget.
   */
  load() {
    if (this.ratingIn) {
      setTimeout(() => this.ratingValue = this.ratingIn);
    } else if (this.rating) {
      setTimeout(() => {
        this.ratingValue = this.rating.rating;
        this.loadedRating.emit(this.rating);
      });
    } else if (this.canEval()) {
      this.dvs.eval();
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      const res = await this.dvs.waitAndGet<RatingRes>(this.apiPath, () => ({
        params: {
          inputs: JSON.stringify({
            input: {
              bySourceId: this.sourceId,
              ofTargetId: this.targetId
            }
          }),
          extraInfo: { returnFields: 'rating' }
        }
      }));
      if (!_.isEmpty(res.errors)) {
        this.ratingValue = undefined;
        this.loadedRating.emit(null);
        this.errors.emit(res.errors);
      } else if (res.data.rating) {
        this.ratingValue = res.data.rating.rating;
        this.loadedRating.emit(res.data.rating);
        this.errors.emit(null);
      }
    } else if (this.dvs) {
      this.dvs.noRequest();
    }
  }

  ngOnDestroy(): void {
    this.dvs.onDestroy();
  }

  private canEval(): boolean {
    return !!(this.dvs && this.sourceId && this.targetId && !this.ratingIn &&
      !this.rating);
  }
}
