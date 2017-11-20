import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { MapComponent } from './map.component';

@NgModule({
  declarations: [
    MapComponent
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
