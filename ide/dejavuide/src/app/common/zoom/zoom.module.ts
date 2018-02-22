import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { ZoomComponent } from './zoom.component';

@NgModule({
  declarations: [
    ZoomComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  exports: [
    ZoomComponent
  ]
})
export class ZoomModule { }
