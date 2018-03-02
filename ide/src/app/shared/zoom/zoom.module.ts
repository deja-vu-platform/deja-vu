import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { ZoomComponent } from './zoom.component';

@NgModule({
  declarations: [
    ZoomComponent
  ],
  imports: [
    CommonModule
  ],
  providers: [],
  exports: [
    ZoomComponent
  ]
})
export class ZoomModule { }
