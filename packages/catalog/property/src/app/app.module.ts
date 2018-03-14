import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';


import { AppComponent } from './app.component';

import { GATEWAY_URL } from 'dv-core';
import { PropertyModule } from './property/property.module';


@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    PropertyModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
