import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnChanges,
  OnInit, Output, Type
} from '@angular/core';
import { DvService, DvServiceFactory, OnEval } from '@deja-vu/core';

import * as _ from 'lodash';
import { API_PATH } from '../rating.config';
import {
  AverageRatingForInputRes, DEFAULT_RATING_FILTER
} from '../shared/rating.model';

/**
 * Filter rating targets so that only targets with average rating
 * higher than certain number are left
 */
@Component({
  selector: 'rating-filter-targets',
  templateUrl: './filter-targets.component.html',
  styleUrls: ['./filter-targets.component.css']
})
export class FilterTargetsComponent implements AfterViewInit, OnEval, OnInit {
  /**
   * A list of choices of minimumAverageRatings that the user can filter with
   * Example:
   *  if minimumAvgRatings = [ 2, 3, 4.5 ]
   *  then the html displayed will be:
   *    [ ] 2 & up
   *    [x] 3 & up
   *    [ ] 4.5 & up
   */
  @Input() minimumAvgRatings = DEFAULT_RATING_FILTER;
  selectedMinimumAvgRating: number;

  /**
   * The targets left after filtering
   */
  @Output() loadedTargets = new EventEmitter<any>();
  _loadedTargets: Object[] = [];

  /**
   * The targetIds of the targets left after filtering
   */
  @Output() loadedTargetIds = new EventEmitter<string[]>();

  private dvs: DvService;

  constructor(
    private readonly elem: ElementRef, private readonly dvf: DvServiceFactory,
    @Inject(API_PATH) private readonly apiPath) {}

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .build();
  }

  ngAfterViewInit() {
    this.load();
  }

  async load() {
    if (!this.dvs) {
      return;
    }
    if (this.canEval()) {
      this.dvs.eval();
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      const res = await this.dvs
        .get<{data: {targetsRatedHigherThan: AverageRatingForInputRes[]}}>(
          this.apiPath, {
            params: {
              inputs: {
                input: {
                  minimumAvgRating: this.selectedMinimumAvgRating
                }
              },
              extraInfo: {
                action: 'filter-targets',
                returnFields: `
                  targetId
                  rating
                `
              }
            }
        });
        this._loadedTargets = res.data.targetsRatedHigherThan;
        this.loadedTargets.emit(this._loadedTargets);
        this.loadedTargetIds.emit(_.map(this._loadedTargets, 'targetId'));
    } else if (this.dvs) {
      this.dvs.noRequest();
    }
  }

  updateSelected(newSelectedMinimumAvgRating) {
    this.selectedMinimumAvgRating = newSelectedMinimumAvgRating;
    this.load();
  }

  private canEval(): boolean {
    return !!(this.dvs);
  }
}
