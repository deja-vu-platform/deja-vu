import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject,
  Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, Type
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnEval, RunService,
  WaiterService, WaiterServiceFactory
} from '@deja-vu/core';

import { NavigationEnd, Router, RouterEvent } from '@angular/router';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs/Subject';

import { API_PATH } from '../rating.config';
import { AverageRatingForInputRes } from '../shared/rating.model';


@Component({
  selector: 'rating-show-average-rating',
  templateUrl: './show-average-rating.component.html',
  styleUrls: ['./show-average-rating.component.css']
})
export class ShowAverageRatingComponent implements
  AfterViewInit, OnDestroy, OnEval, OnInit, OnChanges {
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

  destroyed = new Subject<any>();

  private gs: GatewayService;
  private ws: WaiterService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private wsf: WaiterServiceFactory, private rs: RunService,
    private router: Router, @Inject(API_PATH) private apiPath) { }

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

  ngOnChanges(changes) {
    if (this.ws && this.ws.processChanges(changes)) {
      this.load();
    }
  }

  /**
   * Download ratings for the target from the server.
   */
  load() {
    if (this.canEval()) {
      this.rs.eval(this.elem);
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      await this.ws.maybeWait();
      this.gs.get<AverageRatingForInputRes>(this.apiPath, {
        params: {
          inputs: { targetId: this.targetId },
          extraInfo: {
            returnFields: `
              rating
              count
            `
          }
        }
      })
      .subscribe((res) => {
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
    return !!(this.gs && this.targetId);
  }
}
