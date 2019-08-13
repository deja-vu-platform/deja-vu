import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { GATEWAY_URL, USED_CONCEPTS_CONFIG } from '@deja-vu/core';

import { AppComponent } from './app.component';

import { TransferModule } from './transfer/transfer.module';

const usedConceptsConfig = {
  transfer: {
    config: {
      balanceType: 'items'
    }
  }
};


@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    TransferModule
  ],
  providers: [
    { provide: GATEWAY_URL, useValue: 'localhost:3000/api' },
    { provide: USED_CONCEPTS_CONFIG, useValue: usedConceptsConfig }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
