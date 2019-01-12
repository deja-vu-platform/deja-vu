import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import {
  GEOLOCATION_CONFIG, GeolocationModule
} from './geolocation/geolocation.module';

import { GATEWAY_URL, DvModule } from 'dv-core';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    GeolocationModule,
    DvModule
  ],
  providers: [
    { provide: GATEWAY_URL, useValue: 'http://localhost:3000/api' },
    { provide: GEOLOCATION_CONFIG, useValue: { mapType: 'leaflet' } }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
