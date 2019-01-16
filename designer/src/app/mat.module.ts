import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import {
  MatButtonModule,
  MatExpansionModule,
  MatIconModule,
  MatListModule,
  MatToolbarModule
} from '@angular/material';

const modules = [
  MatButtonModule,
  MatExpansionModule,
  MatIconModule,
  MatListModule,
  MatToolbarModule
];

@NgModule({
  imports: [
    CommonModule,
    ...modules
  ],
  exports: modules,
  declarations: []
})
export class MatModule { }
