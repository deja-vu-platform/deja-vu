import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { MapComponent } from './map.component';
import { MapWidgetComponent } from './map-widget.component';

@NgModule({
  declarations: [
    MapComponent,
    MapWidgetComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  exports: [
    MapComponent
  ]
})
export class MapModule { }
