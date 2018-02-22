import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { GridComponent } from './grid.component';

@NgModule({
  declarations: [
    GridComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  exports: [
    GridComponent
  ]
})
export class PaletteModule { }
