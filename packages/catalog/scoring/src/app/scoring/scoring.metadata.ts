import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatButtonModule, MatFormFieldModule, MatInputModule
} from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { DvModule } from '@deja-vu/core';

import { CreateScoreComponent } from './create-score/create-score.component';
export { CreateScoreComponent };
import { ShowScoreComponent } from './show-score/show-score.component';
export { ShowScoreComponent };
import { ShowTargetComponent } from './show-target/show-target.component';
export { ShowTargetComponent };
import {
  ShowTargetsByScoreComponent
} from './show-targets-by-score/show-targets-by-score.component';
export { ShowTargetsByScoreComponent };
import { DeleteScoresComponent } from './delete-scores/delete-scores.component';
export { DeleteScoresComponent };
import { DeleteScoreComponent } from './delete-score/delete-score.component';
export { DeleteScoreComponent };
import { UpdateScoreComponent } from './update-score/update-score.component';
export { UpdateScoreComponent };


const allComponents = [
  CreateScoreComponent, ShowScoreComponent, ShowTargetComponent,
  ShowTargetsByScoreComponent, DeleteScoresComponent, DeleteScoreComponent, UpdateScoreComponent
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
