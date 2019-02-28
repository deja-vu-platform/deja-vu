import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule }   from '@angular/forms';
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
