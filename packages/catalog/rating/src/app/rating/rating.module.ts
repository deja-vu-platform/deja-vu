import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RateTargetComponent } from './rate-target/rate-target.component';
import { ShowAverageRatingComponent } from './show-average-rating/show-average-rating.component';
import { ShowRatingComponent } from './show-rating/show-rating.component';
import { ShowRatingsByTargetComponent } from './show-ratings-by-target/show-ratings-by-target.component';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [RateTargetComponent, ShowAverageRatingComponent, ShowRatingComponent, ShowRatingsByTargetComponent]
})
export class RatingModule { }
