import {
  Component, ElementRef, EventEmitter, Inject, Input, OnChanges, OnInit, Output,
  ViewChild
} from '@angular/core';

import {
  AbstractControl, FormBuilder, FormControl, FormGroup, FormGroupDirective,
  NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators
} from '@angular/forms';

import {
  GatewayService, GatewayServiceFactory, OnExec, OnExecFailure, OnExecSuccess,
  RunService
} from 'dv-core';

import * as _ from 'lodash';

import { API_PATH } from '../follow.config';
import { Message } from '../shared/follow.model';

const SAVED_MSG_TIMEOUT = 3000;

interface CreateMessageRes {
  data: { createMessage: Message };
  errors: { message: string }[];
}

@Component({
  selector: 'follow-create-message',
  templateUrl: './create-message.component.html',
  styleUrls: ['./create-message.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: CreateMessageComponent,
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: CreateMessageComponent,
      multi: true
    }
  ]
})
export class CreateMessageComponent implements
  OnInit, OnExec, OnExecFailure, OnExecSuccess {
  @Input() id: string | undefined;
  @Input() publisherId: string;

  @Input() showOptionToSubmit = true;

  // Presentation text
  @Input() buttonLabel = 'Create Message';
  @Input() inputLabel = 'Write your message';
  @Input() newMessageSavedText = 'New message saved';

  @Output() message: EventEmitter<Message> = new EventEmitter<Message>();

  @ViewChild(FormGroupDirective) form;
  contentControl = new FormControl('', Validators.required);
  createMessageForm: FormGroup = this.builder.group({
    contentControl: this.contentControl
  });

  newMessageSaved = false;
  newMessageError: string;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, private builder: FormBuilder,
    @Inject(API_PATH) private apiPath) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  onSubmit() {
    this.rs.exec(this.elem);
  }

  async dvOnExec(): Promise<void> {
    const res = await this.gs.post<CreateMessageRes>(this.apiPath, {
      query: `mutation CreateMessage($input: CreateMessageInput!) {
            createMessage(input: $input) {
              id,
              content
            }
          }`,
      variables: {
        input: {
          id: this.id,
          publisherId: this.publisherId,
          content: this.contentControl.value
        }
      }
    })
      .toPromise();

    if (res.errors) {
      throw new Error(_.map(res.errors, 'message')
        .join());
    }

    this.message.emit({
      id: res.data.createMessage.id,
      content: res.data.createMessage.content
    });
  }

  dvOnExecSuccess() {
    this.newMessageSaved = true;
    this.newMessageError = '';
    window.setTimeout(() => {
      this.newMessageSaved = false;
    }, SAVED_MSG_TIMEOUT);
    // Can't do `this.form.reset();`
    // See https://github.com/angular/material2/issues/4190
    if (this.form) {
      this.form.resetForm();
    }
  }

  dvOnExecFailure(reason: Error) {
    this.newMessageError = reason.message;
  }
}

