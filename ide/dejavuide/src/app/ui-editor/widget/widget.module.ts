import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { WidgetComponent } from './widget.component';
import { WidgetOptionsModule } from './widget-options/widget-options.module';
import { WidgetDisplayModule } from '../../common/widget-display/widget-display.module';

@NgModule({
  declarations: [
    WidgetComponent
  ],
  imports: [
    BrowserModule,
    WidgetOptionsModule,
    WidgetDisplayModule
  ],
  providers: [],
  exports: [
    WidgetComponent
  ]
})
export class WidgetModule { }
