import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject,
  Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnEval, RunService,
  WaiterService, WaiterServiceFactory
} from '@deja-vu/core';


import { NavigationEnd, Router, RouterEvent } from '@angular/router';
import { Subject } from 'rxjs/Subject';

import { API_PATH } from '../rating.config';
import { Rating } from '../shared/rating.model';

import * as _ from 'lodash';
import { filter, take, takeUntil } from 'rxjs/operators';


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

  destroyed = new Subject<any>();
  ratingValue: number;
  private gs: GatewayService;
  private ws: WaiterService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private wsf: WaiterServiceFactory,
    private rs: RunService, private router: Router,
    @Inject(API_PATH) private apiPath) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
    this.ws = this.wsf.for(this, this.waitOn);
    this.router.events
      .pipe(
        filter((e: RouterEvent) => e instanceof NavigationEnd),
        takeUntil(this.destroyed))
      .subscribe(() => {
        this.load();
      });
  }

  ngAfterViewInit() {
    this.load();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.ws && this.ws.processChanges(changes)) {
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
      this.rs.eval(this.elem);
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      await this.ws.maybeWait();
      this.gs.get<RatingRes>(this.apiPath, {
        params: {
          inputs: JSON.stringify({
            input: {
              bySourceId: this.sourceId,
              ofTargetId: this.targetId
            }
          }),
          extraInfo: { returnFields: 'rating' }
        }
      })
        .subscribe((res) => {
          if (!_.isEmpty(res.errors)) {
            this.ratingValue = undefined;
            this.loadedRating.emit(null);
            this.errors.emit(res.errors);
          } else if (res.data.rating) {
            this.ratingValue = res.data.rating.rating;
            this.loadedRating.emit(res.data.rating);
            this.errors.emit(null);
          }
        });
    } else if (this.gs) {
      this.gs.noRequest();
    }
  }

  ngOnDestroy(): void {
    this.destroyed.next();
    this.destroyed.complete();
  }

  private canEval(): boolean {
    return !!(this.gs && this.sourceId && this.targetId && !this.ratingIn &&
      !this.rating);
  }
}
