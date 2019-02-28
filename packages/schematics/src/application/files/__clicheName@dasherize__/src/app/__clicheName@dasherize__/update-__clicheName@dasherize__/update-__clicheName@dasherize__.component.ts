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

import { API_PATH } from '../<%= dasherize(clicheName) %>.config';
import { <%= classify(clicheName) %> } from '../shared/<%= dasherize(clicheName) %>.model';

const SAVED_MSG_TIMEOUT = 3000;

interface <%= classify(clicheName) %>Res {
  data: { <%= camelize(clicheName) %>: <%= classify(clicheName) %> };
  errors: { message: string }[];
}

interface Update<%= classify(clicheName) %>Res {
  data: { update<%= classify(clicheName) %>: boolean };
  errors: { message: string }[];
}

@Component({
  selector: '<%= dasherize(clicheName) %>-update-<%= dasherize(clicheName) %>',
  templateUrl: './update-<%= dasherize(clicheName) %>.component.html',
  styleUrls: ['./update-<%= dasherize(clicheName) %>.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: Update<%= classify(clicheName) %>Component,
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: Update<%= classify(clicheName) %>Component,
      multi: true
    }
  ]
})
export class Update<%= classify(clicheName) %>Component implements
  OnInit, OnExec, OnExecFailure, OnExecSuccess, OnChanges {
  @Input() id: string;

  // Presentation text
  @Input() buttonLabel = 'Update <%= capitalize(clicheName) %>';
  @Input() inputLabel = 'Edit <%= clicheName %>';
  @Input() update<%= classify(clicheName) %>SavedText = '<%= capitalize(clicheName) %> updated';
  @Input() startEditButtonLabel = 'Edit';
  @Input() stopEditButtonLabel = 'Cancel';

  @ViewChild(FormGroupDirective) form;
  contentControl = new FormControl('', Validators.required);
  update<%= classify(clicheName) %>Form: FormGroup = this.builder.group({
    contentControl: this.contentControl
  });

  isEditing = false;
  update<%= classify(clicheName) %>Saved = false;
  update<%= classify(clicheName) %>Error: string;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, private builder: FormBuilder,
    @Inject(API_PATH) private apiPath) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
    this.load<%= classify(clicheName) %>();
  }

  ngOnChanges() {
    this.load<%= classify(clicheName) %>();
  }

  load<%= classify(clicheName) %>() {
    if (!this.gs || !this.id) {
      return;
    }

    this.gs.get<<%= classify(clicheName) %>Res>(this.apiPath, {
      params: {
        inputs: { id: this.id },
        extraInfo: {
          action: 'load',
          returnFields: 'id, content'
        }
      }
    })
    .subscribe((res) => {
      const <%= camelize(clicheName) %> = res.data.<%= camelize(clicheName) %>;
      if (<%= camelize(clicheName) %>) {
        this.contentControl.setValue(<%= camelize(clicheName) %>.content);
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
    const res = await this.gs.post<Update<%= classify(clicheName) %>Res>(this.apiPath, {
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

    return res.data.update<%= classify(clicheName) %>;
  }

  dvOnExecSuccess() {
    this.update<%= classify(clicheName) %>Saved = true;
    this.update<%= classify(clicheName) %>Error = '';
    window.setTimeout(() => {
      this.update<%= classify(clicheName) %>Saved = false;
    }, SAVED_MSG_TIMEOUT);
    // Can't do `this.updateTaskForm.reset();`
    // See https://github.com/angular/material2/issues/4190
    if (this.form) {
      this.form.resetForm();
    }
  }

  dvOnExecFailure(reason: Error) {
    this.update<%= classify(clicheName) %>Error = reason.message;
  }
}
