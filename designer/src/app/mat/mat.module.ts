import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule, MatToolbarModule } from '@angular/material';

@NgModule({
  imports: [
    CommonModule,
    MatListModule,
  ],
  exports: [
    MatListModule,
    MatToolbarModule,
  ],
  declarations: [],
})
export class MatModule { }
