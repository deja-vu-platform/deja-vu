import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';

import { DvModule, GATEWAY_URL } from '@deja-vu/core';
import { AppComponent } from './app.component';
import { RatingModule } from './rating/rating.module';


@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    RatingModule,
    RouterModule.forRoot([]),
    DvModule
  ],
  providers: [{ provide: GATEWAY_URL, useValue: 'localhost:3000/api' }],
  bootstrap: [AppComponent]
})
export class AppModule { }
