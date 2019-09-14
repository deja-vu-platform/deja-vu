import { CommonModule } from '@angular/common';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatButtonModule, MatChipsModule, MatFormFieldModule,
  MatIconModule, MatInputModule, MatSelectModule
} from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { DvModule } from '@deja-vu/core';

import { AttachLabelsComponent } from './attach-labels/attach-labels.component';
export { AttachLabelsComponent };
import { CreateLabelComponent } from './create-label/create-label.component';
export { CreateLabelComponent };
import {
  SearchItemsByLabelsComponent
} from './search-items-by-labels/search-items-by-labels.component';
export { SearchItemsByLabelsComponent };
import { SetLabelsComponent } from './set-labels/set-labels.component';
export { SetLabelsComponent };
import { ShowItemComponent } from './show-item/show-item.component';
export { ShowItemComponent };
import { ShowItemsComponent } from './show-items/show-items.component';
export { ShowItemsComponent };
import { ShowLabelComponent } from './show-label/show-label.component';
export { ShowLabelComponent };
import { ShowLabelsComponent } from './show-labels/show-labels.component';
export { ShowLabelsComponent };
import {
  ShowItemCountComponent
} from './show-item-count/show-item-count.component';
export { ShowItemCountComponent };
import {
  ShowLabelCountComponent
} from './show-label-count/show-label-count.component';
export { ShowLabelCountComponent };


const allComponents = [
  CreateLabelComponent, SearchItemsByLabelsComponent,
  ShowItemComponent, ShowItemsComponent, ShowLabelComponent,
  ShowLabelsComponent, AttachLabelsComponent, ShowItemCountComponent,
  ShowLabelCountComponent, SetLabelsComponent
];

const metadata = {
  imports: [
    CommonModule, DvModule, FormsModule, ReactiveFormsModule,
    BrowserAnimationsModule, MatButtonModule, MatChipsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule
  ],
  declarations: allComponents,
  exports: allComponents,
  entryComponents: allComponents
};

export { metadata };
