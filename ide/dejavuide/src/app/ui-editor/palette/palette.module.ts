import { CommonModule } from '@angular/common';
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
    CommonModule
  ],
  providers: [],
  exports: [
    PaletteComponent
  ]
})
export class PaletteModule { }
