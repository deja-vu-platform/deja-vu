import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';


import { AppComponent } from './app.component';
import { GroupModule } from './group/group.module';

import { GATEWAY_URL } from 'dv-core';


@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    GroupModule
  ],
  providers: [{provide: GATEWAY_URL, useValue: 'http://localhost:3000/api'}],
  bootstrap: [AppComponent]
})
export class AppModule { }
