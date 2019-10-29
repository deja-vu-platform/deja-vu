import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';

import { DvModule, GATEWAY_URL, USED_CONCEPTS_CONFIG } from '@deja-vu/core';
import { AllocatorModule } from './allocator/allocator.module';
import { AppComponent } from './app.component';


@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    RouterModule.forRoot([]),
    DvModule,
    AllocatorModule
  ],
  providers: [
    { provide: GATEWAY_URL, useValue: 'localhost:3000/api' },
    { provide: USED_CONCEPTS_CONFIG, useValue: {} }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
