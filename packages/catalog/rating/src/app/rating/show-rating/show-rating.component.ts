import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject,
  Input, OnChanges, OnInit, Output, SimpleChanges, Type
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnEval, RunService
} from 'dv-core';

import { take } from 'rxjs/operators';

import * as _ from 'lodash';

import { API_PATH } from '../rating.config';
import { Rating } from '../shared/rating.model';

interface RatingRes {
  data: { rating: Rating };
  errors: { message: string }[];
}

@Component({
  selector: 'rating-show-rating',
  templateUrl: './show-rating.component.html',
  styleUrls: ['./show-rating.component.css']
})
export class ShowRatingComponent implements
  AfterViewInit, OnEval, OnInit, OnChanges {
  // Either (`sourceId`, `targetId`) or `ratingIn` must be given. If
  // `ratingIn` is given this rating is displayed
  @Input() sourceId: string;
  @Input() targetId: string;

  @Input() ratingIn: number;

  @Output() rating = new EventEmitter<number>();

  ratingValue: number;
  private gs: GatewayService;

  constructor(private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, @Inject(API_PATH) private apiPath) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  ngAfterViewInit() {
    this.loadRating();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.loadRating();
  }

  /**
   * Load a rating from the server (if any), and set the value of the widget.
   */
  loadRating() {
    if (this.ratingIn) {
      setTimeout(() => {
        this.ratingValue = this.ratingIn;
        this.rating.emit(this.ratingValue);
      });
    } else if (this.canEval()) {
      this.rs.eval(this.elem);
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      this.gs.get<RatingRes>(this.apiPath, {
        params: {
          query: `
            query Rating($input: RatingInput!) {
              rating(input: $input) {
                rating
              }
            }
          `,
          variables: {
            input: {
              bySourceId: this.sourceId,
              ofTargetId: this.targetId
            }
          }
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

  private canEval(): boolean {
    return !!(this.gs && this.sourceId && this.targetId && !this.ratingIn);
  }
}
