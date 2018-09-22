import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { GATEWAY_URL } from 'dv-core';

import { AppComponent } from './app.component';

import { TransferModule } from './transfer/transfer.module';

import { CONFIG } from './transfer/transfer.config';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    TransferModule
  ],
  providers: [
    { provide: GATEWAY_URL, useValue: 'http://localhost:3000/api' },
    { provide: CONFIG, useValue: { balanceType: 'items' } }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
