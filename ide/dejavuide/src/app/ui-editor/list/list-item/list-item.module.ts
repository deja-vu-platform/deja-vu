import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule} from '@angular/platform-browser/animations';
import { MatDialogModule } from '@angular/material';
import { RouterModule } from '@angular/router';

import { ListItemComponent } from './list-item.component';
import { WidgetDeleteDialogComponent } from './widget-delete-dialog.component';
import { WidgetModule } from '../../widget/widget.module';

import { DeleteDialogModule } from '../../../common/delete-dialog/delete-dialog.module';

@NgModule({
  declarations: [
    ListItemComponent,
    WidgetDeleteDialogComponent
  ],
  imports: [
    BrowserModule,
    RouterModule,
    BrowserAnimationsModule,
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
