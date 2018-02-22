import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { WidgetDisplayComponent } from './widget-display.component';
import { BaseWidgetDisplayModule } from './base-widget-display/base-widget-display.module';

@NgModule({
  declarations: [
    WidgetDisplayComponent
  ],
  imports: [
    BrowserModule,
    BaseWidgetDisplayModule
  ],
  providers: [],
  exports: [
    WidgetDisplayComponent
  ]
})
export class WidgetDisplayModule { }
