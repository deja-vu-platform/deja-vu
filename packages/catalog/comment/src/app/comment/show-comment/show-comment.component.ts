import { DatePipe } from '@angular/common';
import { Component, Input } from '@angular/core';

import { Comment } from '../shared/comment.model';

@Component({
  selector: 'comment-show-comment',
  templateUrl: './show-comment.component.html',
  providers: [ DatePipe ]
})
export class ShowCommentComponent {
  @Input() comment: Comment;

  @Input() showId = true;
  @Input() showAuthor = true;
  @Input() showTarget = true;
  @Input() showContent = true;

  @Input() noAuthorText = 'No author';
  @Input() noTargetText = 'No target';
  @Input() noContentText = 'No content';
}
