import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { ListSectionComponent } from './list_section.component';

@NgModule({
  declarations: [
    ListSectionComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  exports: [
    ListSectionComponent
  ]
})
export class ListSectionModule { }
