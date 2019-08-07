import {
  Component, ElementRef, Inject, Input, OnChanges, OnInit, Type,
  EventEmitter, Output
} from '@angular/core';
import { Action, GatewayService, GatewayServiceFactory } from '@deja-vu/core';
import * as _ from 'lodash';

import { API_PATH } from '../comment.config';
import { Comment } from '../shared/comment.model';

import { ShowCommentComponent } from '../show-comment/show-comment.component';

interface CommentsRes {
  data: { comments: Comment[] };
  errors: { message: string }[];
}

@Component({
  selector: 'comment-show-comments',
  templateUrl: './show-comments.component.html',
  styleUrls: ['./show-comments.component.css']
})
export class ShowCommentsComponent implements OnInit, OnChanges {
  // Fetch rules
  // If undefined then the fetched comments are not filtered by that property
  @Input() byAuthorId: string | undefined;
  @Input() ofTargetId: string | undefined;

  // Show rules
  /* What fields of the comment to show. These are passed as input
     to `showComment` */
  @Input() showId = true;
  @Input() showAuthorId = true;
  @Input() showTargetId = true;
  @Input() showContent = true;

  @Input() showComment: Action = {
    type: <Type<Component>> ShowCommentComponent
  };
  @Input() noCommentsToShowText = 'No comments to show';
  comments: Comment[] = [];
  @Output() loadedComments = new EventEmitter<Comment[]>();

  showComments;
  private gs: GatewayService;
  loaded = false;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    @Inject(API_PATH) private apiPath) {
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
        .get<CommentsRes>(this.apiPath, {
          params: {
            inputs: JSON.stringify({
              input: {
                byAuthorId: this.byAuthorId,
                ofTargetId: this.ofTargetId
              }
            }),
            extraInfo: {
              returnFields: `
                ${this.showId ? 'id' : ''}
                ${this.showAuthorId ? 'authorId' : ''}
                ${this.showTargetId ? 'targetId' : ''}
                ${this.showContent ? 'content' : ''}
              `
            }
          }
        })
        .subscribe((res) => {
          this.comments = res.data.comments;
          this.loadedComments.emit(this.comments);
          this.loaded = true;
        });
    }
  }
}
