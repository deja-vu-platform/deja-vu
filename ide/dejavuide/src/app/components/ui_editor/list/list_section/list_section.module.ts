import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { ListSectionComponent } from './list_section.component';
import { ListItemModule } from './list_item/list_item.module';

@NgModule({
  declarations: [
    ListSectionComponent
  ],
  imports: [
    BrowserModule,
    ListItemModule
  ],
  providers: [],
  exports: [
    ListSectionComponent
  ]
})
export class ListSectionModule { }
