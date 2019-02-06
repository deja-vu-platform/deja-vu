import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { GATEWAY_URL, DvModule } from '@dejavu-lang/core';

import { AppComponent } from './app.component';
import { RankingModule } from './ranking/ranking.module';


@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    DvModule,
    RankingModule
  ],
  providers: [ {provide: GATEWAY_URL, useValue: 'http://localhost:3000/api'} ],
  bootstrap: [AppComponent]
})
export class AppModule { }
