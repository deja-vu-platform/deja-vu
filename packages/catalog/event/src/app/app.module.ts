import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';


import { DvModule, GATEWAY_URL } from '@deja-vu/core';
import { AppComponent } from './app.component';
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
  providers: [{ provide: GATEWAY_URL, useValue: 'localhost:3000/api' }],
  bootstrap: [AppComponent]
})
export class AppModule { }
