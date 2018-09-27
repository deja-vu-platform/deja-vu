import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject,
  Input, OnChanges, OnInit, Output, SimpleChanges, Type
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnAfterAbort, OnAfterCommit,
  OnRun, RunService
} from 'dv-core';
import { take } from 'rxjs/operators';

import { API_PATH } from '../rating.config';
import { Rating } from '../shared/rating.model';

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
export class RateTargetComponent implements
  OnInit, OnChanges, OnRun, OnAfterAbort {
  @Input() sourceId: string;
  sourceIdChange = new EventEmitter<void>();
  @Input() targetId: string;
  targetIdChange = new EventEmitter<void>();

  @Output() rating = new EventEmitter<number>();

  prevRatingValue: number;
  ratingValue: number;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, @Inject(API_PATH) private apiPath) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
    this.loadRating();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.sourceId || changes.newSourceId) {
      this.sourceIdChange.emit();
    }
    if (changes.targetId || changes.newTargetId) {
      this.targetIdChange.emit();
    }
    this.loadRating();
  }

  setRating($event) {
    this.prevRatingValue = this.ratingValue;
    this.ratingValue = $event.rating;
    this.rs.run(this.elem);
  }

  /**
   * Sync the rating on the server with the rating on the client.
   */
  async dvOnRun() {
    if (this.sourceId === undefined) {
      await this.sourceIdChange.asObservable()
        .pipe(take(1))
        .toPromise();
    }
    if (this.targetId === undefined) {
      await this.targetIdChange.asObservable()
        .pipe(take(1))
        .toPromise();
    }

    this.gs.post<SetRatingRes>(this.apiPath, {
      query: `mutation SetRating($input: SetRatingInput!) {
            setRating(input: $input)
          }
        `,
      variables: {
        input: {
          sourceId: this.sourceId,
          targetId: this.targetId,
          newRating: this.ratingValue
        }
      }
    })
      .subscribe((res) => {
        this.rating.emit(this.ratingValue);
      });
  }

  dvOnAfterAbort() {
    this.ratingValue = this.prevRatingValue;
    this.rating.emit(this.ratingValue);
  }

  /**
   * Load a rating from the server (if any), and set the value of the widget.
   */
  async loadRating() {
    if (!this.sourceId || !this.targetId || !this.gs) {
      return;
    }
    this.gs.get<RatingRes>(this.apiPath, {
      params: {
        query: `
          query Rating($input: RatingInput!) {
            rating(input: $input) {
              rating
            }
          }
        `,
        variables: JSON.stringify({
          input: {
            bySourceId: this.sourceId,
            ofTargetId: this.targetId
          }
        })
      }
    })
      .subscribe((res) => {
        if (res.data.rating) {
          this.ratingValue = res.data.rating.rating;
          this.rating.emit(this.ratingValue);
        }
      });
  }
}
