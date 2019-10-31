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
export class EditMessageComponent
  implements AfterViewInit, OnInit, OnEval, OnExec, OnExecFailure,
    OnExecSuccess, OnChanges {
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

  private dvs: DvService;

  constructor(
    private elem: ElementRef, private dvf: DvServiceFactory,
    private builder: FormBuilder, @Inject(API_PATH) private apiPath) { }

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
    const res = await this.dvs.get<LoadMessageRes>(this.apiPath, {
      params: {
        inputs: { id: this.id },
        extraInfo: {
          action: 'load',
          returnFields: 'content'
        }
      }
    });
    const msg = res.data.message;
    if (msg) {
      this.contentControl.setValue(msg.content);
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

  async dvOnExec(): Promise<Boolean> {
    const res = await this.dvs.post<EditMessageRes>(this.apiPath, {
      inputs: {
        input: {
          id: this.id,
          publisherId: this.publisherId,
          content: this.contentControl.value
        }
      },
      extraInfo: { action: 'edit' }
    });

    if (res.errors) {
      throw new Error(_.map(res.errors, 'message')
        .join());
    }

    return res.data.editMessage;
  }

  dvOnExecSuccess() {
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

  dvOnExecFailure(reason: Error) {
    this.editMessageError = reason.message;
  }
}
