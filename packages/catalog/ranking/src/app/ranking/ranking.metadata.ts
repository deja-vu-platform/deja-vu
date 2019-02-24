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
export { CreateRankingComponent };
import { ShowRankingComponent } from './show-ranking/show-ranking.component';
export { ShowRankingComponent };
import { ShowRankingsComponent } from './show-rankings/show-rankings.component';
export { ShowRankingsComponent };
import { ShowTargetComponent } from './show-target/show-target.component';
export { ShowTargetComponent };
import {
  ShowFractionalRankingComponent
} from './show-fractional-ranking/show-fractional-ranking.component';
export { ShowFractionalRankingComponent };

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
