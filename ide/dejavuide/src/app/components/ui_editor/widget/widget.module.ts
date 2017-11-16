import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { WidgetComponent } from './widget.component';

@NgModule({
  declarations: [
    WidgetComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  exports: [
    WidgetComponent
  ]
})
export class WidgetModule { }
