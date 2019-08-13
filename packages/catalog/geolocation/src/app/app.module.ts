import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { GeolocationModule } from './geolocation/geolocation.module';

import { USED_CONCEPTS_CONFIG, DvModule, GATEWAY_URL } from '@deja-vu/core';

import { AppComponent } from './app.component';

const usedConceptsConfig = {
  geolocation: {
    config: {
      mapType: 'leaflet'
    }
  }
};

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
    { provide: GATEWAY_URL, useValue: 'localhost:3000/api' },
    { provide: USED_CONCEPTS_CONFIG, useValue: usedConceptsConfig }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
