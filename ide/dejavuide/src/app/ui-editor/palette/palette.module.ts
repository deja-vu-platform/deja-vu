import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { PaletteComponent } from './palette.component';
import { PaletteCellComponent } from './palette-cell.component';
import { CurrentColorCellComponent } from './current-color-cell.component';

@NgModule({
  declarations: [
    PaletteComponent,
    PaletteCellComponent,
    CurrentColorCellComponent
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
