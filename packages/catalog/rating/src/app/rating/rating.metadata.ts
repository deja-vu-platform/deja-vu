import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  MatButtonModule, MatFormFieldModule, MatInputModule
} from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import {
  RateTargetComponent
} from './rate-target/rate-target.component';
export { RateTargetComponent };
import {
  ShowAverageRatingComponent
} from './show-average-rating/show-average-rating.component';
export { ShowAverageRatingComponent };
import {
  ShowRatingComponent
} from './show-rating/show-rating.component';
export { ShowRatingComponent };
import {
  ShowRatingsByTargetComponent
} from './show-ratings-by-target/show-ratings-by-target.component';
export { ShowRatingsByTargetComponent };
import {
  ShowRatingCountComponent
} from './show-rating-count/show-rating-count.component';
export { ShowRatingCountComponent };
import {
  DeleteRatingsComponent
} from './delete-ratings/delete-ratings.component';
export { DeleteRatingsComponent };

import { StarRatingModule } from 'angular-star-rating';

import { DvModule } from '@deja-vu/core';


const allComponents = [
  DeleteRatingsComponent, RateTargetComponent, ShowAverageRatingComponent,
  ShowRatingComponent, ShowRatingsByTargetComponent, ShowRatingCountComponent
];


const metadata = {
  imports: [
    CommonModule,
    DvModule,
    FormsModule,
    BrowserAnimationsModule,
    MatButtonModule, MatInputModule, MatFormFieldModule,
    StarRatingModule.forRoot()
  ],
  declarations: allComponents,
  entryComponents: allComponents,
  exports: allComponents
};

export { metadata };
