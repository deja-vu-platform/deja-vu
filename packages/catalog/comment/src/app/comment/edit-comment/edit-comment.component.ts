import {
  Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, ViewChild
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
  selector: 'comment-edit-comment',
  templateUrl: './edit-comment.component.html',
  styleUrls: ['./edit-comment.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: EditCommentComponent,
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: EditCommentComponent,
      multi: true
    }
  ]
})
export class EditCommentComponent implements
  OnInit, OnRun, OnAfterAbort, OnAfterCommit, OnChanges {
  @Input() id: string;
  @Input() authorId: string;

  // Presentation text
  @Input() buttonLabel = 'Update Comment';
  @Input() inputLabel = 'Edit your comment';
  @Input() editCommentSavedText = 'Comment updated';
  @Input() startEditButtonLabel = 'Edit';
  @Input() stopEditButtonLabel = 'Cancel';

  @ViewChild(FormGroupDirective) form;
  contentControl = new FormControl('', Validators.required);
  editCommentForm: FormGroup = this.builder.group({
    contentControl: this.contentControl
  });

  isEditing = false;
  editCommentSaved = false;
  editCommentError: string;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, private builder: FormBuilder) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
    this.loadComment();
  }

  ngOnChanges() {
    this.loadComment();
  }

  loadComment() {
    if (!this.gs || !this.id) {
      return;
    }

    this.gs.get<{data: { comment: Comment }}>('/graphql', {
      params: {
        query: `
          query {
            comment(id: "${this.id}") {
              id
              author { id }
              target { id }
              content
            }
          }
        `
      }
    })
      .pipe(_.map((res) => res.data.comment))
      .subscribe((comment: Comment) => {
        this.contentControl.setValue(comment.content);
      });
  }

  startEditing() {
    this.isEditing = true;
  }

  stopEditing() {
    this.isEditing = false;
  }

  onSubmit() {
    this.rs.run(this.elem);
  }

  async dvOnRun(): Promise<string> {
    const res = await this.gs.post<{
      data: any, errors: { message: string }[]
    }>('/graphql', {
      query: `mutation EditComment($input: EditCommentInput!) {
            editComment(input: $input)
          }`,
      variables: {
        input: {
          id: this.id,
          authorId: this.authorId,
          content: this.contentControl.value
        }
      }
    })
      .toPromise();

    if (res.errors) {
      throw new Error(_.map(res.errors, 'message')
        .join());
    }

    return res.data.editComment.id;
  }

  dvOnAfterCommit() {
    this.editCommentSaved = true;
    this.editCommentError = '';
    window.setTimeout(() => {
      this.editCommentSaved = false;
    }, SAVED_MSG_TIMEOUT);
    // Can't do `this.updateTaskForm.reset();`
    // See https://github.com/angular/material2/issues/4190
    if (this.form) {
      this.form.resetForm();
    }
  }

  dvOnAfterAbort(reason: Error) {
    this.editCommentError = reason.message;
  }
}
