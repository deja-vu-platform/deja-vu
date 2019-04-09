import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatButtonModule, MatFormFieldModule, MatInputModule,
  MatSelectModule
} from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { DvModule } from '@deja-vu/core';

// import and export all cliché actions here
import { CreateMatchComponent } from './create-match/create-match.component';
export { CreateMatchComponent };
import { DeleteMatchComponent } from './delete-match/delete-match.component';
export { DeleteMatchComponent };
import { ShowMatchComponent } from './show-match/show-match.component';
export { ShowMatchComponent };
import { UpdateMatchComponent } from './update-match/update-match.component';
export { UpdateMatchComponent };


// add all cliché actions here
const allComponents = [
  CreateMatchComponent, DeleteMatchComponent,
  ShowMatchComponent, UpdateMatchComponent
];

const metadata = {
  imports: [
    BrowserAnimationsModule,
    CommonModule,
    DvModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule, MatInputModule, MatFormFieldModule, MatSelectModule
  ],
  declarations: allComponents,
  entryComponents: allComponents,
  exports: allComponents
};

export { metadata };
