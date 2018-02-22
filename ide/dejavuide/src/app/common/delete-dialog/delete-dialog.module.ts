import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogModule } from '@angular/material';

import { DeleteDialogComponent } from './delete-dialog.component';

@NgModule({
  declarations: [
    DeleteDialogComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MatDialogModule,
  ],
  entryComponents: [
    DeleteDialogComponent
  ],
  providers: [],
  exports: [
    DeleteDialogComponent
  ]
})
export class DeleteDialogModule { }
