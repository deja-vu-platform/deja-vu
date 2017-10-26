import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { ListItemComponent } from './list_item.component';

@NgModule({
  declarations: [
    ListItemComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  exports: [
    ListItemComponent
  ]
})
export class ListItemModule { }
