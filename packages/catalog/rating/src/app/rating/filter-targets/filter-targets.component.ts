import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnChanges,
  OnInit, Output, Type
} from '@angular/core';
import {
  ConfigService, ConfigServiceFactory, GatewayService,
  GatewayServiceFactory, OnEval, RunService
} from '@deja-vu/core';

import { API_PATH } from '../rating.config';
import { AverageRatingForInputRes, DEFAULT_RATING_FILTER } from '../shared/rating.model';

/**
 * Filter rating targets so that only targets with average rating
 * higher than certain number are left
 */
@Component({
  selector: 'rating-filter-targets',
  templateUrl: './filter-targets.component.html',
  styleUrls: ['./filter-targets.component.css']
})
export class FilterTargetsComponent implements AfterViewInit, OnEval, OnInit
{
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

  private gs: GatewayService;
  private cs: ConfigService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, private csf: ConfigServiceFactory,
    @Inject(API_PATH) private apiPath) {
  }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
    this.cs = this.csf.createConfigService(this.elem);
  }

  ngAfterViewInit() {
    this.load();
  }

  async load() {
    if (!this.gs) {
      return;
    }
    if (this.canEval()) {
      this.rs.eval(this.elem);
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      this.gs
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
        })
        .subscribe((res) => {
          console.log(res);
          console.log(res.data);
          console.log(res.data.targetsRatedHigherThan);
          this._loadedTargets = res.data.targetsRatedHigherThan;
          this.loadedTargets.emit(this._loadedTargets);
        });
    } else if (this.gs) {
      this.gs.noRequest();
    }
  }

  updateSelected(newSelectedMinimumAvgRating) {
    this.selectedMinimumAvgRating = newSelectedMinimumAvgRating;
    this.load();
  }

  private canEval(): boolean {
    return !!(this.gs);
  }
}
