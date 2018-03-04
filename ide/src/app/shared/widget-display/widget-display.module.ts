import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { WidgetDisplayComponent } from './widget-display.component';
import { BaseWidgetDisplayModule } from './base-widget-display/base-widget-display.module';

@NgModule({
  declarations: [
    WidgetDisplayComponent
  ],
  imports: [
    CommonModule,
    BaseWidgetDisplayModule
  ],
  providers: [],
  exports: [
    WidgetDisplayComponent
  ]
})
export class WidgetDisplayModule { }
