import {
  Component, ElementRef, EventEmitter, Inject, Input, OnChanges, OnInit, Output,
  ViewChild
} from '@angular/core';

import {
  AbstractControl, FormBuilder, FormControl, FormGroup, FormGroupDirective,
  NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators
} from '@angular/forms';

import {
  DvService, DvServiceFactory, OnExec, OnExecFailure, OnExecSuccess
} from '@deja-vu/core';

import * as _ from 'lodash';

import { API_PATH } from '../comment.config';
import { Comment } from '../shared/comment.model';

const SAVED_MSG_TIMEOUT = 3000;

interface CreateCommentRes {
  data: { createComment: Comment };
  errors: { message: string }[];
}

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
export class CreateCommentComponent
  implements OnInit, OnExec, OnExecFailure, OnExecSuccess {
  @Input() id: string | undefined;
  @Input() authorId: string;
  @Input() targetId: string;

  @Input() showOptionToSubmit = true;
  @Input() showDoneMessage = true;

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

  private dvs: DvService;

  constructor(
    private readonly elem: ElementRef, private readonly dvf: DvServiceFactory,
    private readonly builder: FormBuilder,
    @Inject(API_PATH) private readonly apiPath) { }

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .build();
  }

  onSubmit() {
    this.dvs.exec();
  }

  async dvOnExec(): Promise<void> {
    const res = await this.dvs.post<CreateCommentRes>(this.apiPath, {
      inputs: {
        input: {
          id: this.id,
          authorId: this.authorId,
          targetId: this.targetId,
          content: this.contentControl.value
        }
      },
      extraInfo: {
        returnFields : `
          id
          authorId
          targetId
          content
        `
      }
    });

    if (res.errors) {
      throw new Error(_.map(res.errors, 'message')
        .join());
    }

    this.comment.emit(res.data.createComment);
  }

  dvOnExecSuccess() {
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

  dvOnExecFailure(reason: Error) {
    this.newCommentError = reason.message;
  }
}

