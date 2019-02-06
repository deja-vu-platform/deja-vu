import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject,
  Input, OnChanges, OnInit, Output, SimpleChanges
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnEval, OnExec, OnExecFailure,
  RunService
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
  AfterViewInit, OnInit, OnChanges, OnEval, OnExec, OnExecFailure {
  @Input() sourceId: string;
  sourceIdChange = new EventEmitter<void>();
  @Input() targetId: string;
  targetIdChange = new EventEmitter<void>();
  @Input() execOnClick = true;

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
  }

  ngAfterViewInit() {
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
    if (this.execOnClick) { this.rs.exec(this.elem); }
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

    this.gs.post<SetRatingRes>(this.apiPath, {
      inputs: {
        input: {
          sourceId: this.sourceId,
          targetId: this.targetId,
          newRating: this.ratingValue
        }
      },
      extraInfo: { action: 'set' }
    })
      .subscribe((res) => {
        this.rating.emit(this.ratingValue);
      });
  }

  dvOnExecFailure() {
    this.ratingValue = this.prevRatingValue;
    this.rating.emit(this.ratingValue);
  }

  /**
   * Load a rating from the server (if any), and set the value of the widget.
   */
  async loadRating() {
    if (this.canEval()) {
      this.rs.eval(this.elem);
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      this.gs.get<RatingRes>(this.apiPath, {
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
        .subscribe((res) => {
          if (res.data.rating) {
            this.ratingValue = res.data.rating.rating;
            this.rating.emit(this.ratingValue);
          }
        });
    }
  }

  private canEval(): boolean {
    return !!(this.gs && this.sourceId && this.targetId);
  }
}
