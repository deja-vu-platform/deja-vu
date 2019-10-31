import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject,
  Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, Type
} from '@angular/core';
import { DvService, DvServiceFactory, OnEval } from '@deja-vu/core';

import { API_PATH } from '../rating.config';
import { AverageRatingForInputRes } from '../shared/rating.model';


@Component({
  selector: 'rating-show-average-rating',
  templateUrl: './show-average-rating.component.html',
  styleUrls: ['./show-average-rating.component.css']
})
export class ShowAverageRatingComponent
  implements AfterViewInit, OnDestroy, OnEval, OnInit, OnChanges {
  @Input() waitOn: string[];
  @Input() targetId: string;

  @Input() ratingLabel = 'vote';

  @Input() showValue = true;
  @Input() showStars = true;
  @Input() showNumRatings = true;

  @Output() averageRating = new EventEmitter<number>();
  averageRatingValue: number;

  @Output() ratingCount = new EventEmitter<number>();
  ratingCountValue = 0;

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

  ngOnChanges(changes) {
    if (this.dvs && this.dvs.waiter.processChanges(changes)) {
      this.load();
    }
  }

  /**
   * Download ratings for the target from the server.
   */
  load() {
    if (this.canEval()) {
      this.dvs.eval();
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      const res = await this.dvs.waitAndGet<AverageRatingForInputRes>(
        this.apiPath,
        () => ({
          params: {
            inputs: { targetId: this.targetId },
            extraInfo: {
              returnFields: `
                rating
                count
              `
            }
          }
        }));
      if (res.data.averageRatingForTarget) {
        this.averageRatingValue = res.data.averageRatingForTarget.rating;
        this.averageRating.emit(this.averageRatingValue);
        this.ratingCountValue = res.data.averageRatingForTarget.count;
        this.ratingCount.emit(this.ratingCountValue);
      } else if (res.errors) {
        this.averageRatingValue = 0;
        this.averageRating.emit(this.averageRatingValue);
        this.ratingCountValue = 0;
        this.ratingCount.emit(this.ratingCountValue);
      }
    } else if (this.dvs) {
      this.dvs.noRequest();
    }
  }

  ngOnDestroy(): void {
    this.dvs.onDestroy();
  }

  private canEval(): boolean {
    return !!(this.dvs && this.targetId);
  }
}
