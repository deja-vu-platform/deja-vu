import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatDialogModule } from '@angular/material';
import { RouterModule } from '@angular/router';

import { ListItemComponent } from './list-item.component';
import { WidgetDeleteDialogComponent } from './widget-delete-dialog/widget-delete-dialog.component';
import { WidgetModule } from '../../widget/widget.module';

import { DeleteDialogModule } from '../../../shared/delete-dialog/delete-dialog.module';

@NgModule({
  declarations: [
    ListItemComponent,
    WidgetDeleteDialogComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    MatDialogModule,
    WidgetModule,
    DeleteDialogModule
  ],
  entryComponents: [
    WidgetDeleteDialogComponent
  ],
  providers: [],
  exports: [
    ListItemComponent
  ]
})
export class ListItemModule { }
