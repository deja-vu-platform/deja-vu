import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

import { ListItemComponent } from './list_item.component';

@NgModule({
  declarations: [
    ListItemComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule
  ],
  providers: [],
  exports: [
    ListItemComponent
  ]
})
export class ListItemModule { }
