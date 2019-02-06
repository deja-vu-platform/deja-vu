import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatButtonModule, MatFormFieldModule, MatInputModule
} from '@angular/material';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { DvModule } from '@dejavu-lang/core';

import {
  CreateCommentComponent
} from './create-comment/create-comment.component';
import {
  DeleteCommentComponent
} from './delete-comment/delete-comment.component';
import { EditCommentComponent } from './edit-comment/edit-comment.component';
import { ShowCommentComponent } from './show-comment/show-comment.component';
import { ShowCommentsComponent } from './show-comments/show-comments.component';

import { API_PATH } from './comment.config';

const allComponents = [
  CreateCommentComponent, DeleteCommentComponent, EditCommentComponent,
  ShowCommentComponent, ShowCommentsComponent
];

@NgModule({
  imports: [
    CommonModule,
    DvModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatMomentDateModule
  ],
  providers: [{ provide: API_PATH, useValue: '/graphql' }],
  declarations: allComponents,
  exports: allComponents,
  entryComponents: allComponents
})
export class CommentModule { }
