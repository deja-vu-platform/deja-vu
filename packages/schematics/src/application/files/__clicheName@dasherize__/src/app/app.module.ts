import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { GATEWAY_URL, DvModule } from '@deja-vu/core';
import { AppComponent } from './app.component';
import { <%= classify(clicheName) %>Module } from './<%= dasherize(clicheName) %>/<%= dasherize(clicheName) %>.module';


@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    <%= classify(clicheName) %>Module,
    DvModule
  ],
  providers: [{provide: GATEWAY_URL, useValue: 'http://localhost:3000/api'}],
  bootstrap: [AppComponent]
})
export class AppModule { }
