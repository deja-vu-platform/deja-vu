import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { LabelModule } from './label/label.module';

import { GATEWAY_URL, DvModule } from '@dejavu-lang/core';

import { AppComponent } from './app.component';


@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    LabelModule,
    DvModule
  ],
  providers: [{provide: GATEWAY_URL, useValue: 'http://localhost:3000/api'}],
  bootstrap: [AppComponent]
})
export class AppModule { }
