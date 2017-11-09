import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { ListComponent } from './list.component';
import { ListSectionModule } from './list_section/list_section.module'

@NgModule({
  declarations: [
    ListComponent
  ],
  imports: [
    BrowserModule,
    ListSectionModule
  ],
  providers: [],
  exports: [
    ListComponent
  ]
})
export class ListModule { }
