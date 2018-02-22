import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogModule } from '@angular/material';

import { ProjectExplorerComponent } from './project-explorer.component';
import { ProjectDeleteDialogComponent } from './project-delete-dialog.component';
import { NewProjectDialogComponent } from './new-project-dialog.component';

import { ProjectPreviewModule } from './project-preview/project-preview.module';
import { LoaderModule } from '../common/loader/loader.module';

import { DeleteDialogModule } from '../common/delete-dialog/delete-dialog.module';

@NgModule({
  declarations: [
    ProjectExplorerComponent,
    ProjectDeleteDialogComponent,
    NewProjectDialogComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MatDialogModule,
    ProjectPreviewModule,
    LoaderModule,
    DeleteDialogModule
  ],
  entryComponents: [
    ProjectDeleteDialogComponent,
    NewProjectDialogComponent
  ],
  providers: [],
  exports: [
    ProjectExplorerComponent
  ]
})
export class ProjectExplorerModule { }
