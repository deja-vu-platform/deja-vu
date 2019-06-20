import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnChanges,
  OnInit, Output, Type
} from '@angular/core';
import {
  ConfigService, ConfigServiceFactory, GatewayService,
  GatewayServiceFactory, OnEval, RunService
} from '@deja-vu/core';

import { API_PATH } from '../rating.config';


const RATING_VALUE_ONE = 1;
const RATING_VALUE_TWO = 2;
const RATING_VALUE_THREE = 3;
const RATING_VALUE_FOUR = 4;

/**
 * Filter out ratings in a list of ratings that are
 * larger than (or equal to) certain number
 */
@Component({
  selector: 'rating-filter-ratings',
  templateUrl: './filter-ratings.component.html',
  styleUrls: ['./filter-ratings.component.css']
})
export class FilterRatingsComponent implements AfterViewInit, OnEval, OnInit
  {
  /**
   * A list of choices of minimumRatings that the user can filter with
   * Example:
   *  if minimumRatings = [ 2, 3, 4.5 ]
   *  then the html displayed will be:
   *    [ ] 2 & up
   *    [x] 3 & up
   *    [ ] 4.5 & up
   */
  @Input() minimumRatings = [ RATING_VALUE_ONE, RATING_VALUE_TWO,
                              RATING_VALUE_THREE, RATING_VALUE_FOUR];
  selectedMinimumRating: number;

  /**
   * The ratings left after filtering
   */
  @Output() loadedRatings = new EventEmitter<any>();
  _loadedRatings: Object[] = [];

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
        .get<{data: {objects: Object[]}}>(this.apiPath, {
          params: {
            inputs: {
              input: {
                minimumRating: this.selectedMinimumRating
              }
            },
            extraInfo: {
              action: 'objects',
              returnFields: `
                sourceId
                targetId
                rating
              `
            }
          }
        })
        .subscribe((res) => {
          this._loadedRatings = res.data.objects;
          this.loadedRatings.emit(this._loadedRatings);
        });
    } else if (this.gs) {
      this.gs.noRequest();
    }
  }

  updateSelected(newSelectedMinimumRating) {
    this.selectedMinimumRating = newSelectedMinimumRating;
    this.load();
  }

  private canEval(): boolean {
    return !!(this.gs);
  }
}
