import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule, MatToolbarModule, MatExpansionModule } from '@angular/material';

@NgModule({
  imports: [
    CommonModule,
    MatListModule,
    MatExpansionModule,
  ],
  exports: [
    MatListModule,
    MatToolbarModule,
    MatExpansionModule,
  ],
  declarations: [],
})
export class MatModule { }
