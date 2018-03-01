import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatDialogModule } from '@angular/material';

import { DeleteDialogComponent } from './delete-dialog.component';

@NgModule({
  declarations: [
    DeleteDialogComponent
  ],
  imports: [
    CommonModule,
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
