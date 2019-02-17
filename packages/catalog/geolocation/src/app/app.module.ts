import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { GeolocationModule } from './geolocation/geolocation.module';

import { USED_CLICHES_CONFIG, DvModule, GATEWAY_URL } from '@deja-vu/core';

import { AppComponent } from './app.component';

const usedClichesConfig = {
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
    { provide: GATEWAY_URL, useValue: 'http://localhost:3000/api' },
    { provide: USED_CLICHES_CONFIG, useValue: usedClichesConfig }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
