import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';


import { AppComponent } from './app.component';
import { GATEWAY_URL, DvModule } from 'dv-core';
import { EventModule } from './event/event.module';


@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    EventModule,
    DvModule
  ],
  providers: [{provide: GATEWAY_URL, useValue: 'http://localhost:3000/api'}],
  bootstrap: [AppComponent]
})
export class AppModule { }
