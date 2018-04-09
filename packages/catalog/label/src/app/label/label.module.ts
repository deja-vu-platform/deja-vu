import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {  } from '.base-dir.ts/.base-dir.ts.component';
import { AttachLabelsComponent } from './attach-labels/attach-labels.component';
import { SearchComponent } from './search/search.component';
import { ShowItemComponent } from './show-item/show-item.component';
import { ShowLabelsComponent } from './show-labels/show-labels.component';
import { ShowSearchResultsComponent } from './show-search-results/show-search-results.component';
import { SharedComponent } from './-shared/-shared.component';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [.BaseDir.TsComponent, AttachLabelsComponent, SearchComponent, ShowItemComponent, ShowLabelsComponent, ShowSearchResultsComponent, SharedComponent]
})
export class LabelModule { }
