import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule }   from '@angular/forms';
import {
  MatButtonModule, MatFormFieldModule, MatInputModule
} from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { DvModule } from '@deja-vu/core';

import { CreateScoreComponent } from './create-score/create-score.component';
import { ShowScoreComponent } from './show-score/show-score.component';
import { ShowTargetComponent } from './show-target/show-target.component';
import {
  ShowTargetsByScoreComponent
} from './show-targets-by-score/show-targets-by-score.component';

import { API_PATH } from './scoring.config';

const allComponents = [
  CreateScoreComponent, ShowScoreComponent, ShowTargetComponent,
  ShowTargetsByScoreComponent
];

const metadata = {
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
};

export { metadata };
