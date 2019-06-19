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
 * Displays an object
 */
@Component({
  selector: 'rating-filter-ratings',
  templateUrl: './filter-ratings.component.html',
  styleUrls: ['./filter-ratings.component.css']
})
export class FilterRatingsComponent implements AfterViewInit, OnEval, OnInit,
  OnChanges {
  /**
   * A list of minimumRatings that the user can filter with
   * Example:
   *  if minimumRatings
   */
  @Input() minimumRatings = [ RATING_VALUE_ONE, RATING_VALUE_TWO,
                              RATING_VALUE_THREE, RATING_VALUE_FOUR];
  /**
   * The objects left after filtering
   */
  @Output() loadedObjects = new EventEmitter<any>();
  _loadedObjects: Object[] = [];

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

  ngOnChanges() {
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
          this._loadedObjects = res.data.objects;
          this.loadedObjects.emit(this._loadedObjects);
        });
    } else if (this.gs) {
      this.gs.noRequest();
    }
  }

  private canEval(): boolean {
    return !!(this.gs);
  }
}
