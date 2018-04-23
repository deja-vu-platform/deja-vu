import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShowTotalComponent } from './show-total/show-total.component';
import { UpdateScoreComponent } from './update-score/update-score.component';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [ShowTotalComponent, UpdateScoreComponent]
})
export class ScoringModule { }
