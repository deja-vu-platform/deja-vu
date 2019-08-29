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

import { API_PATH } from '../<%= dasherize(conceptName) %>.config';
import { <%= classify(conceptName) %> } from '../shared/<%= dasherize(conceptName) %>.model';

const SAVED_MSG_TIMEOUT = 3000;

interface <%= classify(conceptName) %>Res {
  data: { <%= camelize(conceptName) %>: <%= classify(conceptName) %> };
  errors: { message: string }[];
}

interface Update<%= classify(conceptName) %>Res {
  data: { update<%= classify(conceptName) %>: boolean };
  errors: { message: string }[];
}

@Component({
  selector: '<%= dasherize(conceptName) %>-update-<%= dasherize(conceptName) %>',
  templateUrl: './update-<%= dasherize(conceptName) %>.component.html',
  styleUrls: ['./update-<%= dasherize(conceptName) %>.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: Update<%= classify(conceptName) %>Component,
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: Update<%= classify(conceptName) %>Component,
      multi: true
    }
  ]
})
export class Update<%= classify(conceptName) %>Component implements
  OnInit, OnExec, OnExecFailure, OnExecSuccess, OnChanges {
  @Input() id: string;

  // Presentation text
  @Input() buttonLabel = 'Update <%= capitalize(conceptName) %>';
  @Input() inputContentLabel = 'Edit Content';
  @Input() update<%= classify(conceptName) %>SavedText = '<%= capitalize(conceptName) %> updated';
  @Input() startEditButtonLabel = 'Edit';
  @Input() stopEditButtonLabel = 'Cancel';

  @ViewChild(FormGroupDirective) form;
  contentControl = new FormControl('', Validators.required);
  update<%= classify(conceptName) %>Form: FormGroup = this.builder.group({
    contentControl: this.contentControl
  });

  isEditing = false;
  update<%= classify(conceptName) %>Saved = false;
  update<%= classify(conceptName) %>Error: string;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, private builder: FormBuilder,
    @Inject(API_PATH) private apiPath) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
    this.load<%= classify(conceptName) %>();
  }

  ngOnChanges() {
    this.load<%= classify(conceptName) %>();
  }

  load<%= classify(conceptName) %>() {
    if (!this.gs || !this.id) {
      return;
    }

    this.gs.get<<%= classify(conceptName) %>Res>(this.apiPath, {
      params: {
        inputs: { id: this.id },
        extraInfo: {
          component: 'load',
          returnFields: 'id, content'
        }
      }
    })
    .subscribe((res) => {
      const <%= camelize(conceptName) %> = res.data.<%= camelize(conceptName) %>;
      if (<%= camelize(conceptName) %>) {
        this.contentControl.setValue(<%= camelize(conceptName) %>.content);
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
    const res = await this.gs.post<Update<%= classify(conceptName) %>Res>(this.apiPath, {
      inputs: {
        input: {
          id: this.id,
          content: this.contentControl.value
        }
      },
      extraInfo: {
        component: 'update'
      }
    })
    .toPromise();

    if (res.errors) {
      throw new Error(_.map(res.errors, 'message')
        .join());
    }

    return res.data.update<%= classify(conceptName) %>;
  }

  dvOnExecSuccess() {
    this.update<%= classify(conceptName) %>Saved = true;
    this.update<%= classify(conceptName) %>Error = '';
    window.setTimeout(() => {
      this.update<%= classify(conceptName) %>Saved = false;
    }, SAVED_MSG_TIMEOUT);
    // Can't do `this.updateTaskForm.reset();`
    // See https://github.com/angular/material2/issues/4190
    if (this.form) {
      this.form.resetForm();
    }
  }

  dvOnExecFailure(reason: Error) {
    this.update<%= classify(conceptName) %>Error = reason.message;
  }
}
