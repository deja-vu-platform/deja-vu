import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { LoaderComponent } from './loader.component';

@NgModule({
  declarations: [
    LoaderComponent
  ],
  imports: [
    CommonModule,
  ],
  providers: [],
  exports: [
    LoaderComponent
  ]
})
export class LoaderModule { }
