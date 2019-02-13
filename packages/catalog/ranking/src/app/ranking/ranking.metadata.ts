import { ModuleWithProviders } from '@angular/core';

import { CommonModule } from '@angular/common';
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
import { ShowRankingsComponent } from './show-rankings/show-rankings.component';
import { ShowTargetComponent } from './show-target/show-target.component';
import {
  ShowFractionalRankingComponent
} from './show-fractional-ranking/show-fractional-ranking.component';

const allComponents = [
  CreateRankingComponent, ShowRankingComponent, ShowTargetComponent,
  ShowFractionalRankingComponent, ShowRankingsComponent
];

const metadata = {
  imports: [
    CommonModule,
    DragulaModule.forRoot(),
    DvModule,
    FormsModule, ReactiveFormsModule,
    BrowserAnimationsModule,
    // Material
    MatButtonModule, MatFormFieldModule, MatInputModule
  ],
  declarations: allComponents,
  entryComponents: allComponents,
  exports: allComponents
};

export { metadata };
