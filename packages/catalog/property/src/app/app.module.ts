import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';


import { AppComponent } from './app.component';

import { DvModule, GATEWAY_URL } from '@deja-vu/core';
import { PropertyModule } from './property/property.module';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    DvModule,
    PropertyModule
  ],
  providers: [{ provide: GATEWAY_URL, useValue: 'localhost:3000/api' }],
  bootstrap: [AppComponent]
})
export class AppModule { }
