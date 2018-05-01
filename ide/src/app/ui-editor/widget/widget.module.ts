import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { WidgetComponent } from './widget.component';
import { WidgetOptionsModule } from './widget-options/widget-options.module';
import { WidgetDisplayModule } from '../../shared/widget-display/widget-display.module';

@NgModule({
  declarations: [
    WidgetComponent
  ],
  imports: [
    CommonModule,
    WidgetOptionsModule,
    WidgetDisplayModule
  ],
  providers: [],
  exports: [
    WidgetComponent
  ]
})
export class WidgetModule { }
