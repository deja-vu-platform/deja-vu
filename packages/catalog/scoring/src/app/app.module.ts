import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { GATEWAY_URL, DvModule } from '@deja-vu/core';

import { AppComponent } from './app.component';
import { ScoringModule } from './scoring/scoring.module';


@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    DvModule,
    ScoringModule
  ],
  providers: [ {provide: GATEWAY_URL, useValue: 'http://localhost:3000/api'} ],
  bootstrap: [AppComponent]
})
export class AppModule { }
