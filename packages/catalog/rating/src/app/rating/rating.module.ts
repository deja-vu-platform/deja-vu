import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MatButtonModule, MatFormFieldModule, MatInputModule
} from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';


import { CreateSourceComponent } from './create-source/create-source.component';
import { CreateTargetComponent } from './create-target/create-target.component';
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
import { RatingServiceFactory } from './shared/rating.service';

import { DvModule } from 'dv-core';


const allComponents = [
  CreateSourceComponent,
  CreateTargetComponent,
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
  providers: [RatingServiceFactory],
  declarations: allComponents,
  entryComponents: allComponents,
  exports: allComponents
})
export class RatingModule { }
