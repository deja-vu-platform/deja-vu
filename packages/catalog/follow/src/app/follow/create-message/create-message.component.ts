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

import { Message } from '../shared/follow.model';

const SAVED_MSG_TIMEOUT = 3000;

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
  OnInit, OnRun, OnAfterAbort, OnAfterCommit {
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
      query: `mutation CreateMessage($input: CreateMessageInput!) {
            createMessage(input: $input) {
              id,
              publisher { id },
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
      publisher: res.data.createMessage.publisher,
      content: res.data.createMessage.content
    });
  }

  dvOnAfterCommit() {
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

  dvOnAfterAbort(reason: Error) {
    this.newMessageError = reason.message;
  }
}

