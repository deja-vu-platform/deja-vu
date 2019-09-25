import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject,
  Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnEval, OnExec, OnExecFailure,
  RunService
} from '@deja-vu/core';

import { API_PATH } from '../rating.config';
import { Rating } from '../shared/rating.model';

import { NavigationEnd, Router, RouterEvent } from '@angular/router';
import { filter, take, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs/Subject';

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
export class RateTargetComponent implements
  AfterViewInit, OnDestroy, OnInit, OnChanges, OnEval, OnExec, OnExecFailure {
  @Input() sourceId: string;
  sourceIdChange = new EventEmitter<void>();
  @Input() targetId: string;
  targetIdChange = new EventEmitter<void>();
  // TODO: rename to execOnRatingChange
  @Input() execOnClick = true;

  @Output() rating = new EventEmitter<number>();

  prevRatingValue: number;
  ratingValue: number;

  destroyed = new Subject<any>();
  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, private router: Router,
    @Inject(API_PATH) private apiPath) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);

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
    if (changes.sourceId || changes.newSourceId) {
      this.sourceIdChange.emit();
    }
    if (changes.targetId || changes.newTargetId) {
      this.targetIdChange.emit();
    }
    this.load();
  }

  setRating($event) {
    this.prevRatingValue = this.ratingValue;
    this.ratingValue = $event.rating;
    if (this.execOnClick) {
      this.rs.exec(this.elem);
    }
  }

  /**
   * Sync the rating on the server with the rating on the client.
   */
  async dvOnExec() {
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

    const res = await this.gs.post<SetRatingRes>(this.apiPath, {
      inputs: {
        input: {
          sourceId: this.sourceId,
          targetId: this.targetId,
          newRating: this.ratingValue
        }
      },
      extraInfo: { action: 'set' }
    })
      .toPromise();

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
      this.rs.eval(this.elem);
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      try {
        const res = await this.gs.get<RatingRes>(this.apiPath, {
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
        })
          .toPromise();
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
    this.destroyed.next();
    this.destroyed.complete();
  }

  private canEval(): boolean {
    return !!(this.gs && this.sourceId && this.targetId);
  }
}
