import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { MapComponent } from './map.component';
import { MapWidgetComponent } from './map-widget.component';
import { WidgetDisplayModule } from '../../shared/widget-display/widget-display.module';

@NgModule({
  declarations: [
    MapComponent,
    MapWidgetComponent
  ],
  imports: [
    CommonModule,
    WidgetDisplayModule
  ],
  providers: [],
  exports: [
    MapComponent
  ]
})
export class MapModule { }
