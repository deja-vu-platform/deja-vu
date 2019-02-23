import { CommonModule } from '@angular/common';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatButtonModule, MatFormFieldModule, MatInputModule
} from '@angular/material';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { DvModule } from '@deja-vu/core';

import {
  CreateCommentComponent
} from './create-comment/create-comment.component';
export { CreateCommentComponent };
import {
  DeleteCommentComponent
} from './delete-comment/delete-comment.component';
export { DeleteCommentComponent };
import { EditCommentComponent } from './edit-comment/edit-comment.component';
export { EditCommentComponent };
import { ShowCommentComponent } from './show-comment/show-comment.component';
export { ShowCommentComponent };
import { ShowCommentsComponent } from './show-comments/show-comments.component';
export { ShowCommentsComponent };


const allComponents = [
  CreateCommentComponent, DeleteCommentComponent, EditCommentComponent,
  ShowCommentComponent, ShowCommentsComponent
];

const metadata = {
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
  declarations: allComponents,
  exports: allComponents,
  entryComponents: allComponents
};

export { metadata };
