import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input,
  OnChanges, OnInit, Output, Type
} from '@angular/core';
import { ComponentValue, DvService, OnEval } from '@deja-vu/core';
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
  AfterViewInit, OnInit, OnChanges, OnEval {
  @Input() waitOn: string[];
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
  loaded = false;
  refresh = false;
  inputsOfLoadedComments = { byAuthorId: undefined, ofTargetId: undefined };

  constructor(
    private readonly elem: ElementRef, private readonly dvs: DvService,
    @Inject(API_PATH) private readonly apiPath) {
    this.showComments = this;
  }

  ngOnInit() {
    this.dvs.register(this.elem, this, this.waitOn, () => {
      this.refresh = true;
      this.load();
    });
  }

  ngAfterViewInit() {
    this.load();
  }

  ngOnChanges(changes) {
    if (this.dvs.waiter && this.dvs.waiter.processChanges(changes)) {
      this.load();
    }
  }

  load() {
    if (this.canEval()) {
      this.dvs.run.eval(this.elem);
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      await this.dvs.waiter.maybeWait();
      this.dvs.gateway
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
          this.refresh = false;
          this.inputsOfLoadedComments = {
            byAuthorId: this.byAuthorId,
            ofTargetId: this.ofTargetId
          };
        });
    } else if (this.dvs.gateway) {
      this.dvs.gateway.noRequest();
    }
  }

  private canEval(): boolean {
    return this.dvs.gateway && (this.refresh || this.commentsAreOld());
  }

  private commentsAreOld(): boolean {
    return this.byAuthorId !== this.inputsOfLoadedComments.byAuthorId  ||
      this.ofTargetId !== this.inputsOfLoadedComments.ofTargetId;
  }
}
