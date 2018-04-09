import {
  Component, ElementRef, Input, OnChanges, OnInit, Type
} from '@angular/core';
import { Action, GatewayService, GatewayServiceFactory } from 'dv-core';
import * as _ from 'lodash';

import { ShowCommentComponent } from '../show-comment/show-comment.component';

import { Comment } from '../shared/comment.model';


@Component({
  selector: 'comment-show-comments',
  templateUrl: './show-comments.component.html',
  styleUrls: ['./show-comments.component.css']
})
export class ShowCommentsComponent implements OnInit, OnChanges {
  // Fetch rules
  // If undefined then the fetched comments are not filtered by that property
  @Input() authorId: string | undefined;
  @Input() targetId: string | undefined;

  // Show rules
  /* What fields of the comment to show. These are passed as input
     to `showComment` */
  @Input() showId = true;
  @Input() showAuthor = true;
  @Input() showTarget = true;
  @Input() showContent = true;

  @Input() showComment: Action = {
    type: <Type<Component>> ShowCommentComponent
  };
  @Input() noCommentsToShowText = 'No comments to show';
  comments: Comment[] = [];

  showComments;
  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory) {
    this.showComments = this;
  }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.fetchComments();
  }

  ngOnChanges() {
    this.fetchComments();
  }

  fetchComments() {
    if (this.gs) {
      this.gs
        .get<{data: {comments: Comment[]}}>('/graphql', {
          params: {
            query: `
              query Comments($input: CommentsInput!) {
                comments(input: $input) {
                  ${this.showId ? 'id' : ''}
                  ${this.showAuthor ? 'target { id }' : ''}
                  ${this.showTarget ? 'author { id }' : ''}
                  ${this.showContent ? 'content' : ''}
                }
              }
            `,
            variables: JSON.stringify({
              input: {
                authorId: this.authorId,
                targetId: this.targetId
              }
            })
          }
        })
        .subscribe((res) => {
          this.comments = res.data.comments;
        });
    }
  }
}
