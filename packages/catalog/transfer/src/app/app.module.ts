import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { GATEWAY_URL } from 'dv-core';

import { AppComponent } from './app.component';
import { TransferModule } from './transfer/transfer.module';


@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    TransferModule
  ],
  providers: [ {provide: GATEWAY_URL, useValue: 'http://localhost:3000/api'} ],
  bootstrap: [AppComponent]
})
export class AppModule { }
