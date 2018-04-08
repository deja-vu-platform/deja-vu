import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EditCommentComponent } from './edit-comment/edit-comment.component';
import { NewCommentComponent } from './new-comment/new-comment.component';
import { NewCommentButtonComponent } from './new-comment-button/new-comment-button.component';
import { NewCommentTextComponent } from './new-comment-text/new-comment-text.component';
import { ShowCommentComponent } from './show-comment/show-comment.component';
import { ShowCommentAuthorComponent } from './show-comment-author/show-comment-author.component';
import { ShowCommentTextComponent } from './show-comment-text/show-comment-text.component';
import { ShowCommentsComponent } from './show-comments/show-comments.component';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [EditCommentComponent, NewCommentComponent, NewCommentButtonComponent, NewCommentTextComponent, ShowCommentComponent, ShowCommentAuthorComponent, ShowCommentTextComponent, ShowCommentsComponent]
})
export class CommentModule { }
