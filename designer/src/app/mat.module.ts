import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import {
  MatExpansionModule,
  MatListModule,
  MatToolbarModule
} from '@angular/material';

@NgModule({
  imports: [
    CommonModule,
    MatListModule,
    MatExpansionModule
  ],
  exports: [
    MatListModule,
    MatToolbarModule,
    MatExpansionModule
  ],
  declarations: []
})
export class MatModule { }
