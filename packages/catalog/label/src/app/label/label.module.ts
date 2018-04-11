import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatButtonModule, MatChipsModule, MatFormFieldModule,
  MatInputModule, MatSelectModule
} from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { DvModule } from 'dv-core';


// tslint:disable-next-line:comment-format
// import {AttachLabelsComponent} from './attach-labels/attach-labels.component'
import { CreateItemComponent } from './create-item/create-item.component';
import { CreateLabelComponent } from './create-label/create-label.component';
import {
  SearchItemsByLabelsComponent
} from './search-items-by-labels/search-items-by-labels.component';
import { ShowItemComponent } from './show-item/show-item.component';
import { ShowItemsComponent } from './show-items/show-items.component';
import { ShowLabelComponent } from './show-label/show-label.component';
import { ShowLabelsComponent } from './show-labels/show-labels.component';

const allComponents = [
  CreateItemComponent, CreateLabelComponent, SearchItemsByLabelsComponent,
  ShowItemComponent, ShowItemsComponent, ShowLabelComponent,
  ShowLabelsComponent
];

@NgModule({
  imports: [
    CommonModule, DvModule, FormsModule, ReactiveFormsModule,
    BrowserAnimationsModule, MatButtonModule, MatChipsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule
  ],
  declarations: allComponents,
  exports: allComponents,
  entryComponents: allComponents
})
export class LabelModule { }
