import { ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  MatButtonModule, MatFormFieldModule, MatInputModule
} from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import {
  RateTargetComponent
} from './rate-target/rate-target.component';
import {
  ShowAverageRatingComponent
} from './show-average-rating/show-average-rating.component';
import {
  ShowRatingComponent
} from './show-rating/show-rating.component';
import {
  ShowRatingsByTargetComponent
} from './show-ratings-by-target/show-ratings-by-target.component';

import { StarRatingModule } from 'angular-star-rating';

import { DvModule } from '@deja-vu/core';


const allComponents = [
  RateTargetComponent, ShowAverageRatingComponent,
  ShowRatingComponent, ShowRatingsByTargetComponent
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
