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

import { Message } from '../shared/follow.model';

const SAVED_MSG_TIMEOUT = 3000;

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
    private rs: RunService, private builder: FormBuilder) { }

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

    this.gs.get<{ data: { message: Message } }>('/graphql', {
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
        this.contentControl.setValue(res.data.message.content);
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
    const res = await this.gs.post<{
      data: any, errors: { message: string }[]
    }>('/graphql', {
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

    return true;
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
