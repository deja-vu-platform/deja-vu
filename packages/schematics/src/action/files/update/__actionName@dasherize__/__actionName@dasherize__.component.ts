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
import { <%= classify(entityName) %> } from '../shared/<%= dasherize(clicheName) %>.model';

const SAVED_MSG_TIMEOUT = 3000;

interface <%= classify(entityName) %>Res {
  data: { <%= camelize(entityName) %>: <%= classify(entityName) %> };
  errors: { message: string }[];
}

interface <%= classify(actionName) %>Res {
  data: { <%= camelize(actionName) %>: boolean };
  errors: { message: string }[];
}

@Component({
  selector: '<%= dasherize(clicheName) %>-<%= dasherize(actionName) %>',
  templateUrl: './<%= dasherize(actionName) %>.component.html',
  styleUrls: ['./<%= dasherize(actionName) %>.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: <%= classify(actionName) %>Component,
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: <%= classify(actionName) %>Component,
      multi: true
    }
  ]
})
export class <%= classify(actionName) %>Component implements
  OnInit, OnExec, OnExecFailure, OnExecSuccess, OnChanges {
  @Input() id: string;

  // Presentation text
  @Input() buttonLabel = 'Update <%= capitalize(entityName) %>';
  @Input() inputContentLabel = 'Edit Content';
  @Input() <%= camelize(actionName) %>SavedText = '<%= capitalize(entityName) %> updated';
  @Input() startEditButtonLabel = 'Edit';
  @Input() stopEditButtonLabel = 'Cancel';

  @ViewChild(FormGroupDirective) form;
  contentControl = new FormControl('', Validators.required);
  <%= camelize(actionName) %>Form: FormGroup = this.builder.group({
    contentControl: this.contentControl
  });

  isEditing = false;
  <%= camelize(actionName) %>Saved = false;
  <%= camelize(actionName) %>Error: string;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, private builder: FormBuilder,
    @Inject(API_PATH) private apiPath) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
    this.load<%= classify(entityName) %>();
  }

  ngOnChanges() {
    this.load<%= classify(entityName) %>();
  }

  load<%= classify(entityName) %>() {
    if (!this.gs || !this.id) {
      return;
    }

    this.gs.get<<%= classify(entityName) %>Res>(this.apiPath, {
      params: {
        inputs: { id: this.id },
        extraInfo: {
          action: 'load',
          returnFields: 'id, content'
        }
      }
    })
    .subscribe((res) => {
      const <%= camelize(entityName) %> = res.data.<%= camelize(entityName) %>;
      if (<%= camelize(entityName) %>) {
        this.contentControl.setValue(<%= camelize(entityName) %>.content);
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
    const res = await this.gs.post<<%= classify(actionName) %>Res>(this.apiPath, {
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

    return res.data.<%= camelize(actionName) %>;
  }

  dvOnExecSuccess() {
    this.<%= camelize(actionName) %>Saved = true;
    this.<%= camelize(actionName) %>Error = '';
    window.setTimeout(() => {
      this.<%= camelize(actionName) %>Saved = false;
    }, SAVED_MSG_TIMEOUT);
    // Can't do `this.updateTaskForm.reset();`
    // See https://github.com/angular/material2/issues/4190
    if (this.form) {
      this.form.resetForm();
    }
  }

  dvOnExecFailure(reason: Error) {
    this.<%= camelize(actionName) %>Error = reason.message;
  }
}
