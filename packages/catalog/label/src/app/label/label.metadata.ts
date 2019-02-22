import { CommonModule } from '@angular/common';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatButtonModule, MatChipsModule, MatFormFieldModule,
  MatIconModule, MatInputModule, MatSelectModule
} from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { DvModule } from '@deja-vu/core';

import { AttachLabelsComponent } from './attach-labels/attach-labels.component';
import { CreateLabelComponent } from './create-label/create-label.component';
import {
  SearchItemsByLabelsComponent
} from './search-items-by-labels/search-items-by-labels.component';
import { ShowItemComponent } from './show-item/show-item.component';
import { ShowItemsComponent } from './show-items/show-items.component';
import { ShowLabelComponent } from './show-label/show-label.component';
import { ShowLabelsComponent } from './show-labels/show-labels.component';


const allComponents = [
  CreateLabelComponent, SearchItemsByLabelsComponent,
  ShowItemComponent, ShowItemsComponent, ShowLabelComponent,
  ShowLabelsComponent, AttachLabelsComponent
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
