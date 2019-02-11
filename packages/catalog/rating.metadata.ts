import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MatButtonModule, MatFormFieldModule, MatInputModule
} from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { StarRatingModule } from 'angular-star-rating';

import { DvModule } from '@deja-vu/core';

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


const components = [
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
  declarations: components,
  entryComponents: components,
  exports: components
};

export { metadata };
