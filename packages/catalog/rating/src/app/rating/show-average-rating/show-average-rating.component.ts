import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject,
  Input, OnChanges, OnInit, Output, SimpleChanges, Type
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnEval, RunService
} from '@dejavu-lang/core';

import { API_PATH } from '../rating.config';
import { Rating } from '../shared/rating.model';

interface AverageRatingForInputRes {
  data: { averageRatingForTarget: { rating: number; count: number } };
  errors: { message: string }[];
}

@Component({
  selector: 'rating-show-average-rating',
  templateUrl: './show-average-rating.component.html',
  styleUrls: ['./show-average-rating.component.css']
})
export class ShowAverageRatingComponent implements AfterViewInit, OnEval,
OnInit, OnChanges {
  @Input() targetId: string;

  @Output() averageRating = new EventEmitter<number>();
  averageRatingValue: number;

  @Output() ratingCount = new EventEmitter<number>();
  ratingCountValue = 0;

  private gs: GatewayService;

  constructor(private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, @Inject(API_PATH) private apiPath) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
    this.loadRatingAverage();
  }

  ngAfterViewInit() {
    this.loadRatingAverage();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.targetId || changes.newTargetId) {
      this.loadRatingAverage();
    }
  }

  /**
   * Download ratings for the target from the server.
   */
  loadRatingAverage() {
    if (this.canEval()) {
      this.rs.eval(this.elem);
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
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
        }
      });
    }
  }

  private canEval(): boolean {
    return !!(this.gs && this.targetId);
  }
}
