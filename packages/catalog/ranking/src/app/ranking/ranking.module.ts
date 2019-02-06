import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule }   from '@angular/forms';
import {
  MatButtonModule, MatFormFieldModule, MatInputModule
} from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { DvModule } from '@deja-vu/core';
import { DragulaModule } from 'ng2-dragula';

import {
  CreateRankingComponent
} from './create-ranking/create-ranking.component';
import { ShowRankingComponent } from './show-ranking/show-ranking.component';
import { ShowTargetComponent } from './show-target/show-target.component';
import {
  ShowFractionalRankingComponent
} from './show-fractional-ranking/show-fractional-ranking.component';

import { API_PATH } from './ranking.config';

const allComponents = [
  CreateRankingComponent, ShowRankingComponent, ShowTargetComponent,
  ShowFractionalRankingComponent
];

@NgModule({
  imports: [
    CommonModule,
    DragulaModule.forRoot(),
    DvModule,
    FormsModule, ReactiveFormsModule,
    BrowserAnimationsModule,
    // Material
    MatButtonModule, MatFormFieldModule, MatInputModule
  ],
  providers: [ { provide: API_PATH, useValue: '/graphql' } ],
  declarations: allComponents,
  entryComponents: allComponents,
  exports: allComponents
})
export class RankingModule { }
