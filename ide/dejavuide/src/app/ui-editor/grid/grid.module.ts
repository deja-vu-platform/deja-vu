import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { GridComponent } from './grid.component';

@NgModule({
  declarations: [
    GridComponent
  ],
  imports: [
    CommonModule
  ],
  providers: [],
  exports: [
    GridComponent
  ]
})
export class PaletteModule { }
