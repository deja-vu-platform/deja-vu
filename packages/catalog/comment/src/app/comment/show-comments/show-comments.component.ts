import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input,
  OnChanges, OnInit, Output, Type
} from '@angular/core';
import {
  ComponentValue, GatewayService, GatewayServiceFactory, OnEval, RunService
} from '@deja-vu/core';
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
export class ShowCommentsComponent implements
OnInit, AfterViewInit, OnChanges, OnEval {
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

  @Input() showComment: ComponentValue = {
    type: <Type<Component>> ShowCommentComponent
  };
  @Input() noCommentsToShowText = 'No comments to show';
  @Input() includeTimestamp = false;
  comments: Comment[] = [];
  @Output() loadedComments = new EventEmitter<Comment[]>();

  showComments;
  private gs: GatewayService;
  loaded = false;
  inputsOfLoadedComments = { byAuthorId: undefined, ofTargetId: undefined };

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, @Inject(API_PATH) private apiPath) {
    this.showComments = this;
  }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  ngAfterViewInit() {
    this.loadComments();
  }

  ngOnChanges() {
    this.loadComments();
  }

  loadComments() {
    if (this.canEval()) {
      this.rs.eval(this.elem);
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
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
                ${this.includeTimestamp ? 'timestamp' : ''}
              `
            }
          }
        })
        .subscribe((res) => {
          this.comments = res.data.comments;
          this.loadedComments.emit(this.comments);
          this.loaded = true;
          this.inputsOfLoadedComments = {
            byAuthorId: this.byAuthorId,
            ofTargetId: this.ofTargetId
          };
        });
    } else if (this.gs) {
      this.gs.noRequest();
    }
  }

  private canEval(): boolean {
    return this.gs && this.commentsAreOld();
  }

  private commentsAreOld(): boolean {
    return this.byAuthorId !== this.inputsOfLoadedComments.byAuthorId  ||
      this.ofTargetId !== this.inputsOfLoadedComments.ofTargetId;
  }
}
