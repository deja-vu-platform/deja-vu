import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnChanges,
  OnInit, ViewChild
} from '@angular/core';

import {
  AbstractControl, FormBuilder, FormControl, FormGroup, FormGroupDirective,
  NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators
} from '@angular/forms';

import {
  DvService, DvServiceFactory, OnExec, OnExecFailure, OnExecSuccess
} from '@deja-vu/core';

import * as _ from 'lodash';

import { API_PATH } from '../chat.config';
import { GraphQlMessage, Message, toMessage } from '../shared/chat.model';

const SAVED_MSG_TIMEOUT = 3000;

interface MessageRes {
  data: { message: GraphQlMessage };
  errors: { message: string }[];
}

interface UpdateMessageRes {
  data: { updateMessage: boolean };
  errors: { message: string }[];
}

@Component({
  selector: 'chat-update-message',
  templateUrl: './update-message.component.html',
  styleUrls: ['./update-message.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: UpdateMessageComponent,
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: UpdateMessageComponent,
      multi: true
    }
  ]
})
export class UpdateMessageComponent
  implements AfterViewInit, OnInit, OnExec, OnExecFailure, OnExecSuccess,
    OnChanges {
  @Input() id: string;
  @Input() authorId: string;

  // Presentation text
  @Input() buttonLabel = 'Update Message';
  @Input() inputContentLabel = 'Edit Content';
  @Input() updateMessageSavedText = 'Message updated';
  @Input() startEditButtonLabel = 'Edit';
  @Input() stopEditButtonLabel = 'Cancel';

  @ViewChild(FormGroupDirective) form;
  contentControl = new FormControl('', Validators.required);
  updateMessageForm: FormGroup = this.builder.group({
    contentControl: this.contentControl
  });

  isEditing = false;
  updateMessageSaved = false;
  updateMessageError: string;

  private dvs: DvService;

  constructor(
    private elem: ElementRef, private dvf: DvServiceFactory,
    private builder: FormBuilder, @Inject(API_PATH) private apiPath) {}

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .build();
  }

  ngAfterViewInit() {
    this.load();
  }

  ngOnChanges() {
    this.load();
  }

  load() {
    if (!this.dvs || !this.id) {
      return;
    }
    this.dvs.eval();
  }

  async dvOnEval(): Promise<void> {
    const res = await this.dvs.get<MessageRes>(this.apiPath, {
      params: {
        inputs: { id: this.id },
        extraInfo: {
          action: 'load',
          returnFields: 'id, content'
        }
      }
    });
    if (res.data) {
      const message = toMessage(res.data.message);
      this.contentControl.setValue(message.content);
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
    const res = await this.dvs.post<UpdateMessageRes>(this.apiPath, {
      inputs: {
        input: {
          id: this.id,
          authorId: this.authorId,
          content: this.contentControl.value
        }
      },
      extraInfo: {
        action: 'update'
      }
    });

    if (res.errors) {
      throw new Error(_.map(res.errors, 'message')
        .join());
    }

    return res.data.updateMessage;
  }

  dvOnExecSuccess() {
    this.updateMessageSaved = true;
    this.updateMessageError = '';
    window.setTimeout(() => {
      this.updateMessageSaved = false;
    }, SAVED_MSG_TIMEOUT);
    // Can't do `this.updateTaskForm.reset();`
    // See https://github.com/angular/material2/issues/4190
    if (this.form) {
      this.form.resetForm();
    }
  }

  dvOnExecFailure(reason: Error) {
    this.updateMessageError = reason.message;
  }
}
