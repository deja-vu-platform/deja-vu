import { CommonModule } from '@angular/common';
// import required for packaging
import { ModuleWithProviders } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MatButtonModule, MatFormFieldModule, MatInputModule, MatRadioModule
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
import { DeleteRatingComponent } from './delete-rating/delete-rating.component';
export { DeleteRatingComponent };
import {
  FilterRatingsComponent
} from './filter-ratings/filter-ratings.component';
export { FilterRatingsComponent };
import {
  FilterTargetsComponent
} from './filter-targets/filter-targets.component';
export { FilterTargetsComponent };

import { StarRatingModule } from 'angular-star-rating';

import { DvModule } from '@deja-vu/core';
import { ConfigWizardComponent } from './config-wizard/config-wizard.component';


const allComponents = [
  RateTargetComponent, ShowAverageRatingComponent, ShowRatingComponent,
  ShowRatingsByTargetComponent, ShowRatingCountComponent,
  DeleteRatingsComponent, DeleteRatingComponent, ConfigWizardComponent,
  FilterRatingsComponent, FilterTargetsComponent
];


const metadata = {
  imports: [
    CommonModule,
    DvModule,
    FormsModule,
    BrowserAnimationsModule,
    MatButtonModule, MatInputModule, MatFormFieldModule, MatRadioModule,
    StarRatingModule.forRoot()
  ],
  declarations: allComponents,
  entryComponents: allComponents,
  exports: allComponents
};

export { metadata };
