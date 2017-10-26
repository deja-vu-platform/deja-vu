import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { ListComponent } from './list.component';

@NgModule({
  declarations: [
    ListComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  exports: [
    ListComponent
  ]
})
export class ListModule { }
