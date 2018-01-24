import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule} from '@angular/platform-browser/animations';
import { MatDialogModule } from '@angular/material';
import { RouterModule } from '@angular/router';

import { ListItemComponent } from './list_item.component';
import { DeleteDialogComponent } from './delete_dialog.component';
import { WidgetModule } from '../../widget/widget.module';

@NgModule({
  declarations: [
    ListItemComponent,
    DeleteDialogComponent
  ],
  imports: [
    BrowserModule,
    RouterModule,
    BrowserAnimationsModule,
    MatDialogModule,
    WidgetModule
  ],
  entryComponents: [
    DeleteDialogComponent
  ],
  providers: [],
  exports: [
    ListItemComponent
  ]
})
export class ListItemModule { }
