import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MatDialogModule } from '@angular/material';

import { ListItemComponent } from './list_item.component';
import { DeleteDialogComponent } from './delete_dialog.component';

@NgModule({
  declarations: [
    ListItemComponent,
    DeleteDialogComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MatDialogModule
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
