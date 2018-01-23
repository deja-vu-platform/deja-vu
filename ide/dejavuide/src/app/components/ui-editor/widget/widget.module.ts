import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { WidgetComponent } from './widget.component';
import { BaseWidgetModule } from './base_widgets/base_widget.module';

@NgModule({
  declarations: [
    WidgetComponent
  ],
  imports: [
    BrowserModule,
    BaseWidgetModule
  ],
  providers: [],
  exports: [
    WidgetComponent
  ]
})
export class WidgetModule { }
