import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { GATEWAY_URL } from 'dv-core';

import { AppComponent } from './app.component';

import { TRANSFER_CONFIG, TransferModule } from './transfer/transfer.module';

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
    { provide: TRANSFER_CONFIG, useValue: { balanceType: 'items' } }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
