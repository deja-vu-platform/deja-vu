import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';


import { AppComponent } from './app.component';

import { GATEWAY_URL } from 'dv-core';
import { PropertyModule } from './property/property.module';

import { DvModule } from 'dv-core';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    DvModule,
    PropertyModule
  ],
  providers: [{provide: GATEWAY_URL, useValue: 'http://localhost:3000/api'}],
  bootstrap: [AppComponent]
})
export class AppModule { }
