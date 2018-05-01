import {
  Component, ElementRef, EventEmitter, Inject, Input, OnChanges, OnInit, 
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

import { API_PATH } from '../follow.config';
import { Message } from '../shared/follow.model';

const SAVED_MSG_TIMEOUT = 3000;

interface EditMessageRes {
  data: { editMessage: boolean };
  errors: { message: string }[];
}

interface LoadMessageRes {
  data: { message: Message };
  errors: { message: string }[];
}

@Component({
  selector: 'follow-edit-message',
  templateUrl: './edit-message.component.html',
  styleUrls: ['./edit-message.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: EditMessageComponent,
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: EditMessageComponent,
      multi: true
    }
  ]
})
export class EditMessageComponent implements
  OnInit, OnRun, OnAfterAbort, OnAfterCommit, OnChanges {
  @Input() id: string;
  @Input() publisherId: string;

  // Presentation text
  @Input() buttonLabel = 'Update Message';
  @Input() inputLabel = 'Edit your message';
  @Input() editMessageSavedText = 'Message updated';
  @Input() startEditButtonLabel = 'Edit';
  @Input() stopEditButtonLabel = 'Cancel';

  @ViewChild(FormGroupDirective) form;
  contentControl = new FormControl('', Validators.required);
  editMessageForm: FormGroup = this.builder.group({
    contentControl: this.contentControl
  });

  isEditing = false;
  editMessageSaved = false;
  editMessageError: string;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, private builder: FormBuilder,
    @Inject(API_PATH) private apiPath) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
    this.loadMessage();
  }

  ngOnChanges() {
    this.loadMessage();
  }

  loadMessage() {
    if (!this.gs || !this.id) {
      return;
    }

    this.gs.get<LoadMessageRes>(this.apiPath, {
      params: {
        query: `
        query {
          message(id: "${this.id}") {
            content
          }
        }
        `
      }
    })
      .subscribe((res) => {
        const msg = res.data.message;
        if (msg) {
          this.contentControl.setValue(msg.content);
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
    this.rs.run(this.elem);
  }

  async dvOnRun(): Promise<Boolean> {
    const res = await this.gs.post<EditMessageRes>(this.apiPath, {
      query: `mutation EditMessage($input: EditMessageInput!) {
            editMessage(input: $input)
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

    return res.data.editMessage;
  }

  dvOnAfterCommit() {
    this.editMessageSaved = true;
    this.editMessageError = '';
    window.setTimeout(() => {
      this.editMessageSaved = false;
    }, SAVED_MSG_TIMEOUT);
    // Can't do `this.updateTaskForm.reset();`
    // See https://github.com/angular/material2/issues/4190
    if (this.form) {
      this.form.resetForm();
    }
  }

  dvOnAfterAbort(reason: Error) {
    this.editMessageError = reason.message;
  }
}
