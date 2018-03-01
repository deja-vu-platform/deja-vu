import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatDialogModule } from '@angular/material';

import { ProjectExplorerComponent } from './project-explorer.component';
import { ProjectDeleteDialogComponent } from './project-delete-dialog/project-delete-dialog.component';
import { NewProjectDialogComponent } from './new-project-dialog/new-project-dialog.component';

import { ProjectPreviewModule } from './project-preview/project-preview.module';

import { LoaderModule } from '../shared/loader/loader.module';
import { DeleteDialogModule } from '../shared/delete-dialog/delete-dialog.module';

@NgModule({
  declarations: [
    ProjectExplorerComponent,
    ProjectDeleteDialogComponent,
    NewProjectDialogComponent
  ],
  imports: [
    CommonModule,
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
