import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { DvModule, GATEWAY_URL } from '@deja-vu/core';

import { AppComponent } from './app.component';

import { AllocatorModule } from './allocator/allocator.module';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    DvModule,
    AllocatorModule
  ],
  providers: [ {provide: GATEWAY_URL, useValue: 'http://localhost:3000/api'}],
  bootstrap: [AppComponent]
})
export class AppModule { }
