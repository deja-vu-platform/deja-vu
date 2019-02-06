import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
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

import { DvModule } from '@dejavu-lang/core';

import { API_PATH } from './rating.config';

const allComponents = [
  RateTargetComponent, ShowAverageRatingComponent,
  ShowRatingComponent, ShowRatingsByTargetComponent
];


@NgModule({
  imports: [
    CommonModule,
    DvModule,
    FormsModule,
    BrowserAnimationsModule,
    MatButtonModule, MatInputModule, MatFormFieldModule,
    StarRatingModule.forRoot()
  ],
  providers: [{ provide: API_PATH, useValue: '/graphql' }],
  declarations: allComponents,
  entryComponents: allComponents,
  exports: allComponents
})
export class RatingModule { }
