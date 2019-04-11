import {
  Component, ElementRef, EventEmitter, Inject, Input, OnChanges, OnInit,
  ViewChild
} from '@angular/core';

import {
  AbstractControl, FormBuilder, FormControl, FormGroup, FormGroupDirective,
  NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators
} from '@angular/forms';

import {
  GatewayService, GatewayServiceFactory, OnExec, OnExecFailure, OnExecSuccess,
  RunService
} from '@deja-vu/core';

import * as _ from 'lodash';

import { API_PATH } from '../chat.config';
import { Chat } from '../shared/chat.model';

const SAVED_MSG_TIMEOUT = 3000;

interface ChatRes {
  data: { chat: Chat };
  errors: { message: string }[];
}

interface UpdateChatRes {
  data: { updateChat: boolean };
  errors: { message: string }[];
}

@Component({
  selector: 'chat-update-chat',
  templateUrl: './update-chat.component.html',
  styleUrls: ['./update-chat.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: UpdateChatComponent,
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: UpdateChatComponent,
      multi: true
    }
  ]
})
export class UpdateChatComponent implements
  OnInit, OnExec, OnExecFailure, OnExecSuccess, OnChanges {
  @Input() id: string;

  // Presentation text
  @Input() buttonLabel = 'Update Chat';
  @Input() inputContentLabel = 'Edit Content';
  @Input() updateChatSavedText = 'Chat updated';
  @Input() startEditButtonLabel = 'Edit';
  @Input() stopEditButtonLabel = 'Cancel';

  @ViewChild(FormGroupDirective) form;
  contentControl = new FormControl('', Validators.required);
  updateChatForm: FormGroup = this.builder.group({
    contentControl: this.contentControl
  });

  isEditing = false;
  updateChatSaved = false;
  updateChatError: string;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, private builder: FormBuilder,
    @Inject(API_PATH) private apiPath) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
    this.loadChat();
  }

  ngOnChanges() {
    this.loadChat();
  }

  loadChat() {
    if (!this.gs || !this.id) {
      return;
    }

    this.gs.get<ChatRes>(this.apiPath, {
      params: {
        inputs: { id: this.id },
        extraInfo: {
          action: 'load',
          returnFields: 'id, content'
        }
      }
    })
    .subscribe((res) => {
      const chat = res.data.chat;
      if (chat) {
        this.contentControl.setValue(chat.content);
      }
    });

  }

  startEditing() {
    this.isEditing = true;
  }

  stopEditing() {
    this.isEditing = false;
  }

  onSubmit() {
    this.rs.exec(this.elem);
  }

  async dvOnExec(): Promise<boolean> {
    const res = await this.gs.post<UpdateChatRes>(this.apiPath, {
      inputs: {
        input: {
          id: this.id,
          content: this.contentControl.value
        }
      },
      extraInfo: {
        action: 'update'
      }
    })
    .toPromise();

    if (res.errors) {
      throw new Error(_.map(res.errors, 'message')
        .join());
    }

    return res.data.updateChat;
  }

  dvOnExecSuccess() {
    this.updateChatSaved = true;
    this.updateChatError = '';
    window.setTimeout(() => {
      this.updateChatSaved = false;
    }, SAVED_MSG_TIMEOUT);
    // Can't do `this.updateTaskForm.reset();`
    // See https://github.com/angular/material2/issues/4190
    if (this.form) {
      this.form.resetForm();
    }
  }

  dvOnExecFailure(reason: Error) {
    this.updateChatError = reason.message;
  }
}
