import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input,
  OnChanges, OnInit, ViewChild
} from '@angular/core';

import {
  AbstractControl, FormBuilder, FormControl, FormGroup, FormGroupDirective,
  NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators
} from '@angular/forms';

import {
  DvService, DvServiceFactory, OnEval, OnExec, OnExecFailure, OnExecSuccess
} from '@deja-vu/core';

import * as _ from 'lodash';

import { API_PATH } from '../comment.config';
import { Comment } from '../shared/comment.model';

const SAVED_MSG_TIMEOUT = 3000;

interface CommentRes {
  data: { comment: Comment };
  errors: { message: string }[];
}

interface EditCommentRes {
  data: { editComment: boolean };
  errors: { message: string }[];
}

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
export class EditCommentComponent
  implements AfterViewInit, OnEval, OnInit, OnExec, OnExecFailure,
    OnExecSuccess, OnChanges {
  @Input() waitOn: string[];
  @Input() id: string;
  @Input() authorId: string;

  // Presentation text
  @Input() buttonLabel = 'Update Comment';
  @Input() inputLabel = 'Edit your comment';
  @Input() editCommentSavedText = 'Comment updated';
  @Input() startEditButtonLabel = 'Edit';
  @Input() stopEditButtonLabel = 'Cancel';
  @Input() resetWhenSaved = true;
  @Input() collapsible = true;

  @ViewChild(FormGroupDirective) form;
  contentControl = new FormControl('', Validators.required);
  editCommentForm: FormGroup = this.builder.group({
    contentControl: this.contentControl
  });

  isEditing = false;
  editCommentSaved = false;
  editCommentError: string;

  private dvs: DvService;

  constructor(
    private readonly elem: ElementRef, private readonly dvf: DvServiceFactory,
    private readonly builder: FormBuilder,
    @Inject(API_PATH) private readonly apiPath) {}

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .withDefaultWaiter()
      .build();
  }

  ngAfterViewInit() {
    this.load();
  }

  ngOnChanges(changes) {
    if (this.dvs && this.dvs.waiter.processChanges(changes)) {
      this.load();
    }
  }

  load() {
    if (this.canEval()) {
      this.dvs.eval();
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      const res = await this.dvs.waitAndGet<CommentRes>(this.apiPath, () => ({
        params: {
          inputs: { id: this.id },
          extraInfo: {
            action: 'load',
            returnFields: 'id, content'
          }
        }
      }));
      const comment = res.data.comment;
      if (comment) {
        this.contentControl.setValue(comment.content);
      }
    } else if (this.dvs) {
      this.dvs.noRequest();
    }
  }

  startEditing() {
    this.isEditing = true;
  }

  stopEditing() {
    this.isEditing = false;
  }

  onSubmit() {
    this.dvs.exec();
  }

  async dvOnExec(): Promise<boolean> {
    const res = await this.dvs.post<EditCommentRes>(this.apiPath, {
      inputs: {
        input: {
          id: this.id,
          authorId: this.authorId,
          content: this.contentControl.value
        }
      },
      extraInfo: {
        action: 'edit'
      }
    });

    if (res.errors) {
      throw new Error(_.map(res.errors, 'message')
        .join());
    }

    return res.data.editComment;
  }

  dvOnExecSuccess() {
    this.editCommentSaved = true;
    this.editCommentError = '';
    window.setTimeout(() => {
      this.editCommentSaved = false;
    }, SAVED_MSG_TIMEOUT);
    // Can't do `this.updateTaskForm.reset();`
    // See https://github.com/angular/material2/issues/4190
    if (this.form && this.resetWhenSaved) {
      this.form.resetForm();
    }
  }

  dvOnExecFailure(reason: Error) {
    this.editCommentError = reason.message;
  }

  private canEval(): boolean {
    return !!this.dvs;
  }
}
