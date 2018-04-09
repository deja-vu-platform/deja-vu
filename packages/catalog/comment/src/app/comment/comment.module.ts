import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatButtonModule, MatDatepickerModule, MatFormFieldModule, MatInputModule,
  MatSelectModule
} from '@angular/material';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { DvModule } from 'dv-core';

import { CreateAuthorComponent } from './create-author/create-author.component';
import {
  CreateCommentComponent
} from './create-comment/create-comment.component';
import { CreateTargetComponent } from './create-target/create-target.component';
import { EditCommentComponent } from './edit-comment/edit-comment.component';
import { ShowAuthorComponent } from './show-author/show-author.component';
import { ShowCommentComponent } from './show-comment/show-comment.component';
import { ShowCommentsComponent } from './show-comments/show-comments.component';
import { ShowTargetComponent } from './show-target/show-target.component';

const allComponents = [
  CreateAuthorComponent, CreateCommentComponent, CreateTargetComponent,
  EditCommentComponent, ShowAuthorComponent, ShowCommentComponent,
  ShowCommentsComponent, ShowTargetComponent
];

@NgModule({
  imports: [
    CommonModule,
    DvModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    // Material
    MatButtonModule, MatDatepickerModule, MatInputModule, MatSelectModule,
    MatFormFieldModule,
    MatMomentDateModule
  ],
  declarations: allComponents,
  exports: allComponents,
  entryComponents: allComponents
})
export class CommentModule { }
