import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnChanges,
  OnDestroy, OnInit, Output, SimpleChanges
} from '@angular/core';
import {
  DvService, DvServiceFactory, OnEval, OnExec, OnExecFailure
} from '@deja-vu/core';

import { API_PATH } from '../rating.config';
import { Rating } from '../shared/rating.model';

import * as _ from 'lodash';


interface SetRatingRes {
  data: { setRating: boolean };
  errors: { message: string }[];
}

interface RatingRes {
  data: { rating: Rating };
  errors: { message: string }[];
}

@Component({
  selector: 'rating-rate-target',
  templateUrl: './rate-target.component.html',
  styleUrls: ['./rate-target.component.css']
})
export class RateTargetComponent
  implements AfterViewInit, OnDestroy, OnInit, OnChanges, OnEval, OnExec,
    OnExecFailure {
  @Input() waitOn: string[];
  @Input() sourceId: string;
  @Input() targetId: string;
  // TODO: support the user selecting a rating with the keyboard. The problem
  // is that triggering the exec onRatingChange can cause problematic behavior.
  // For example, if the user wraps this component in a dv.tx with a dv.redirect
  // to the same page.
  @Input() execOnClick = true;

  @Output() rating = new EventEmitter<number>();

  prevRatingValue: number;
  ratingValue: number;

  private dvs: DvService;

  constructor(
    private readonly elem: ElementRef, private readonly dvf: DvServiceFactory,
    @Inject(API_PATH) private readonly apiPath) {}

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

  setRating($event) {
    this.prevRatingValue = this.ratingValue;
    this.ratingValue = $event.rating;
    if (this.execOnClick) {
      this.dvs.exec();
    }
  }

  /**
   * Sync the rating on the server with the rating on the client.
   */
  async dvOnExec() {
    const res = await this.dvs.waitAndPost<SetRatingRes>(this.apiPath, () => ({
      inputs: {
        input: {
          sourceId: this.sourceId,
          targetId: this.targetId,
          newRating: this.ratingValue
        }
      },
      extraInfo: { action: 'set' }
    }));

    if (res.errors) {
      throw new Error(_.map(res.errors, 'message')
        .join());
    } else {
      this.rating.emit(this.ratingValue);
    }
  }

  dvOnExecFailure() {
    this.ratingValue = this.prevRatingValue;
    this.rating.emit(this.ratingValue);
  }

  /**
   * Load a rating from the server (if any), and set the value of the widget.
   */
  async load() {
    if (this.canEval()) {
      this.dvs.eval();
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      try {
        const res = await this.dvs.waitAndGet<RatingRes>(this.apiPath, () => ({
          params: {
            inputs: JSON.stringify({
              input: {
                bySourceId: this.sourceId,
                ofTargetId: this.targetId
              }
            }),
            extraInfo: {
              action: 'load',
              returnFields: 'rating'
            }
          }
        }));
        if (res.data.rating) {
          this.ratingValue = res.data.rating.rating;
          this.rating.emit(this.ratingValue);
        } else if (res.errors) {
          this.ratingValue = undefined;
          this.rating.emit(this.ratingValue);
        }
      } catch (e) {
        this.ratingValue = undefined;
        this.rating.emit(this.ratingValue);
      }
    }
  }

  ngOnDestroy(): void {
    this.dvs.onDestroy();
  }

  private canEval(): boolean {
    return !!(this.dvs && this.sourceId && this.targetId);
  }
}
