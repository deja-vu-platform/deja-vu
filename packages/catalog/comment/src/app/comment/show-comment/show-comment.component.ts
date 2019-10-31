import { DatePipe } from '@angular/common';
import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnChanges,
  OnInit, Output
} from '@angular/core';
import { DvService, DvServiceFactory, OnEval } from '@deja-vu/core';
import * as _ from 'lodash';

import { API_PATH } from '../comment.config';
import { Comment } from '../shared/comment.model';

@Component({
  selector: 'comment-show-comment',
  templateUrl: './show-comment.component.html',
  providers: [DatePipe]
})
export class ShowCommentComponent
  implements OnInit, AfterViewInit, OnChanges, OnEval {
  // Provide one of the following: id, (authorId and targetId) or comment
  @Input() id: string | undefined;
  @Input() authorId: string | undefined;
  @Input() targetId: string | undefined;
  @Input() comment: Comment | undefined;

  @Input() showId = true;
  @Input() showAuthorId = true;
  @Input() showTargetId = true;
  @Input() showContent = true;

  @Output() loadedComment = new EventEmitter<Comment>();
  @Output() errors = new EventEmitter<any>();

  private dvs: DvService;

  private idOfLoadedComment: string | undefined;

  constructor(
    private readonly elem: ElementRef, private readonly dvf: DvServiceFactory,
    @Inject(API_PATH) private readonly apiPath) { }

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .build();
  }

  ngAfterViewInit() {
    this.loadComment();
  }

  ngOnChanges() {
    this.loadComment();
  }

  loadComment() {
    if (this.canEval()) {
      this.dvs.eval();
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      if (this.id) {
        const res = await this.dvs
          .get<{ data: { comment: Comment }, errors: any }>(this.apiPath, {
            params: {
              inputs: { id: this.id },
              extraInfo: {
                action: 'comment-by-id',
                returnFields: `
                  ${this.showId ? 'id' : ''}
                  ${this.showContent ? 'content' : ''}
                  ${this.showAuthorId ? 'authorId' : ''}
                  ${this.showTargetId ? 'targetId' : ''}
                `
              }
            }
          });
        if (!_.isEmpty(res.errors)) {
          this.idOfLoadedComment = undefined;
          this.comment = null;
          this.loadedComment.emit(null);
          this.errors.emit(res.errors);
        } else {
          this.idOfLoadedComment = this.id;
          this.comment = res.data.comment;
          this.loadedComment.emit(this.comment);
          this.errors.emit(null);
        }
      } else if (this.authorId && this.targetId) {
        const res = await this.dvs
          .get<{data: { commentByAuthorTarget: Comment }, errors: any}>(
            this.apiPath,
            {
              params: {
                inputs: {
                  input: {
                    byAuthorId: this.authorId,
                    ofTargetId: this.targetId
                  }
                },
                extraInfo: {
                  action: 'comment-by-author',
                  returnFields: `
                  ${this.showId ? 'id' : ''}
                  ${this.showContent ? 'content' : ''}
                  ${this.showAuthorId ? 'authorId' : ''}
                  ${this.showTargetId ? 'targetId' : ''}
                `
                }
              }
            });
        if (!_.isEmpty(res.errors)) {
          this.loadedComment.emit(null);
          this.errors.emit(res.errors);
        } else {
          this.comment = res.data.commentByAuthorTarget;
          this.loadedComment.emit(this.comment);
          this.errors.emit(null);
        }
      }
    } else if (this.dvs) {
      this.dvs.noRequest();
    }
  }

  private canEval(): boolean {
    return !!(
      this.dvs &&
      (!this.comment || this.commentByIdIsOld()) &&
      (this.id || (this.authorId && this.targetId))
    );
  }

  private commentByIdIsOld() {
    return this.idOfLoadedComment && this.idOfLoadedComment !== this.id;
  }
}
