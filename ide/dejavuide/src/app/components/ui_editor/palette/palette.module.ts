import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { PaletteComponent } from './palette.component';
import { PaletteCellComponent } from './palette_cell.component';

@NgModule({
  declarations: [
    PaletteComponent,
    PaletteCellComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  exports: [
    PaletteComponent
  ]
})
export class PaletteModule { }
