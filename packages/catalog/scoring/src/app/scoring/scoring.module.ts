import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule }   from '@angular/forms';
import {
  MatButtonModule, MatFormFieldModule, MatInputModule
} from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { DvModule } from 'dv-core';

import { CreateScoreComponent } from './create-score/create-score.component';
import { CreateScoreValueComponent } from './create-score-value/create-score-value.component';
import { CreateTargetComponent } from './create-target/create-target.component';
import { ShowScoreComponent } from './show-score/show-score.component';
import { ShowTargetComponent } from './show-target/show-target.component';
// import { ShowTotalComponent } from './show-total/show-total.component';
import { UpdateTargetComponent } from './update-target/update-target.component';

const allComponents = [
  CreateScoreComponent, CreateScoreValueComponent, CreateTargetComponent,
  ShowScoreComponent, ShowTargetComponent, UpdateTargetComponent];

@NgModule({
  imports: [
    CommonModule,
    DvModule,
    FormsModule, ReactiveFormsModule,
    BrowserAnimationsModule,
    // Material
    MatButtonModule, MatFormFieldModule, MatInputModule
  ],
  declarations: allComponents,
  entryComponents: allComponents,
  exports: allComponents
})
export class ScoringModule { }
