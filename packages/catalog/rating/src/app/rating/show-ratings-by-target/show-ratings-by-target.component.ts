import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject,
  Input, OnChanges, OnInit, Output, SimpleChanges, Type
} from '@angular/core';
import {
  ComponentValue, DvService, DvServiceFactory, OnEval
} from '@deja-vu/core';

import { API_PATH } from '../rating.config';
import { Rating } from '../shared/rating.model';

import { ShowRatingComponent } from '../show-rating/show-rating.component';

interface RatingsRes {
  data: { ratings: Rating[] };
  errors: { message: string }[];
}

@Component({
  selector: 'rating-show-ratings-by-target',
  templateUrl: './show-ratings-by-target.component.html',
  styleUrls: ['./show-ratings-by-target.component.css']
})
export class ShowRatingsByTargetComponent
  implements AfterViewInit, OnEval, OnInit, OnChanges {
  @Input() targetId: string;

  @Input() showRating: ComponentValue = {
    type: <Type<Component>>ShowRatingComponent
  };

  @Input() noRatingsToShowText = 'No ratings to show';
  ratings: Rating[] = [];

  showRatingsByTarget;
  private dvs: DvService;

  constructor(
    private readonly elem: ElementRef, private readonly dvf: DvServiceFactory,
    @Inject(API_PATH) private readonly apiPath) {
    this.showRatingsByTarget = this;
  }

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .build();
  }

  ngAfterViewInit() {
    this.load();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.load();
  }

  async load() {
    if (this.canEval()) {
      this.dvs.eval();
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      const res = await this.dvs.get<RatingsRes>(this.apiPath, {
        params: {
          inputs: JSON.stringify({
            input: {
              ofTargetId: this.targetId
            }
          }),
          extraInfo: {
            returnFields: `
              sourceId
              targetId
              rating
            `
          }
        }
      });
      this.ratings = res.data.ratings;
    } else if (this.dvs) {
      this.dvs.noRequest();
    }
  }

  private canEval(): boolean {
    return !!(this.dvs && this.targetId);
  }
}
