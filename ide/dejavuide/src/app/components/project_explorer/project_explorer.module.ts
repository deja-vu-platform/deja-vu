import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogModule } from '@angular/material';

import { ProjectExplorerComponent } from './project_explorer.component';
import { ProjectDeleteDialogComponent } from './project_delete_dialog.component';
import { NewProjectDialogComponent } from './new_project_dialog.component';

import { ProjectPreviewModule } from './project_preview/project_preview.module';
import { LoaderModule } from '../common/loader/loader.module';

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
    LoaderModule
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
