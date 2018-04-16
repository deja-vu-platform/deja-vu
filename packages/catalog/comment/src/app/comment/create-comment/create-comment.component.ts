import {
  Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output,
  ViewChild
} from '@angular/core';

import {
  AbstractControl, FormBuilder, FormControl, FormGroup, FormGroupDirective,
  NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators
} from '@angular/forms';

import {
  GatewayService, GatewayServiceFactory, OnAfterAbort, OnAfterCommit, OnRun,
  RunService
} from 'dv-core';

import * as _ from 'lodash';

import { Comment } from '../shared/comment.model';

const SAVED_MSG_TIMEOUT = 3000;

@Component({
  selector: 'comment-create-comment',
  templateUrl: './create-comment.component.html',
  styleUrls: ['./create-comment.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: CreateCommentComponent,
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: CreateCommentComponent,
      multi: true
    }
  ]
})
export class CreateCommentComponent implements
  OnInit, OnRun, OnAfterAbort, OnAfterCommit {
  @Input() id: string | undefined;
  @Input() authorId: string;
  @Input() targetId: string;

  @Input() showOptionToSubmit = true;

  // Presentation text
  @Input() buttonLabel = 'Create Comment';
  @Input() inputLabel = 'Write your comment';
  @Input() newCommentSavedText = 'New comment saved';

  @Output() comment: EventEmitter<Comment> = new EventEmitter<Comment>();

  @ViewChild(FormGroupDirective) form;
  contentControl = new FormControl('', Validators.required);
  createCommentForm: FormGroup = this.builder.group({
    contentControl: this.contentControl
  });

  newCommentSaved = false;
  newCommentError: string;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, private builder: FormBuilder) { }

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
          content: this.contentControl.value
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
      author: res.data.createComment.author,
      target: res.data.createComment.target,
      content: res.data.createComment.content
    });
  }

  dvOnAfterCommit() {
    this.newCommentSaved = true;
    this.newCommentError = '';
    window.setTimeout(() => {
      this.newCommentSaved = false;
    }, SAVED_MSG_TIMEOUT);
    // Can't do `this.form.reset();`
    // See https://github.com/angular/material2/issues/4190
    if (this.form) {
      this.form.resetForm();
    }
  }

  dvOnAfterAbort(reason: Error) {
    this.newCommentError = reason.message;
  }
}
