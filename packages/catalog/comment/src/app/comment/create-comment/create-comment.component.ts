import {
  Component, ElementRef, EventEmitter, Input, OnInit, Output
} from '@angular/core';

import {
  GatewayService, GatewayServiceFactory, OnAfterAbort, OnAfterCommit,
  OnRun, RunService
} from 'dv-core';

import * as _ from 'lodash';

const SAVED_MSG_TIMEOUT = 3000;

@Component({
  selector: 'comment-create-comment',
  templateUrl: './create-comment.component.html',
  styleUrls: ['./create-comment.component.css']
})
export class CreateCommentComponent implements
  OnInit, OnRun, OnAfterAbort, OnAfterCommit {
  @Input() id: string | undefined;
  @Input() authorId: string;
  @Input() targetId: string;
  @Input() content: string;

  // Presentation text
  @Input() buttonLabel = 'Create Comment';
  @Input() inputLabel = 'Write your comment';
  @Input() newCommentSavedText = 'New comment saved';

  @Output() comment = new EventEmitter();

  newCommentSaved = false;
  newCommentError: string;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  onSubmit() {
    this.rs.run(this.elem);
  }

  async dvOnRun(): Promise<void> {
    const res = await this.gs.post<{
      data: any, errors: { message: string }[]
    }>('/graphql', {
      query: `mutation CreateComment($input: CreateCommentInput!) {
            createComment(input: $input) {
              id,
              author { id },
              target { id },
              content
            }
          }`,
      variables: {
        input: {
          id: this.id,
          authorId: this.authorId,
          targetId: this.targetId,
          content: this.content
        }
      }
    })
      .toPromise();

    if (res.errors) {
      throw new Error(_.map(res.errors, 'message')
        .join());
    }

    this.comment.emit({
      id: res.data.createComment.id,
      authorId: res.data.createComment.authorId,
      targetId: res.data.createComment.targetId,
      content: res.data.createComment.content
    });
  }

  dvOnAfterCommit() {
    this.newCommentSaved = true;
    this.newCommentError = '';
    window.setTimeout(() => {
      this.newCommentSaved = false;
    }, SAVED_MSG_TIMEOUT);
    this.content = '';
  }

  dvOnAfterAbort(reason: Error) {
    this.newCommentError = reason.message;
  }
}

