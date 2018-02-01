import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { MapComponent } from './map.component';
import { MapWidgetComponent } from './map-widget.component';
import { WidgetDisplayModule } from '../../common/widget-display/widget-display.module';

@NgModule({
  declarations: [
    MapComponent,
    MapWidgetComponent
  ],
  imports: [
    BrowserModule,
    WidgetDisplayModule
  ],
  providers: [],
  exports: [
    MapComponent
  ]
})
export class MapModule { }
