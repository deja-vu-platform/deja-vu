import {
  Component, ElementRef, EventEmitter, Inject, Input, OnInit, Output, ViewChild
} from '@angular/core';
import {
  FormBuilder, FormControl, FormGroup, FormGroupDirective,
  NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators
} from '@angular/forms';
import {
  GatewayService, GatewayServiceFactory, OnExec, OnExecFailure, OnExecSuccess,
  RunService
} from '@deja-vu/core';

import * as _ from 'lodash';

import { API_PATH } from '../<%= dasherize(clicheName) %>.config';
import { <%= classify(clicheName) %> } from '../shared/<%= dasherize(clicheName) %>.model';


interface Create<%= classify(clicheName) %>Res {
  data: { create<%= classify(clicheName) %>: <%= classify(clicheName) %> };
  errors: { message: string }[];
}

const SAVED_MSG_TIMEOUT = 3000;

@Component({
  selector: '<%= dasherize(clicheName) %>-create-<%= dasherize(clicheName) %>',
  templateUrl: './create-<%= dasherize(clicheName) %>.component.html',
  styleUrls: ['./create-<%= dasherize(clicheName) %>.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: Create<%= classify(clicheName) %>Component,
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: Create<%= classify(clicheName) %>Component,
      multi: true
    }
  ]
})
export class Create<%= classify(clicheName) %>Component implements OnInit, OnExec, OnExecFailure,
  OnExecSuccess {
  @Input() id: string | undefined;
  @Input() set content(inputContent: string) {
    this.contentControl.setValue(inputContent);
  }
  @Input() showOptionToSubmit = true;

  // Presentation inputs
  @Input() buttonLabel = 'Create <%= classify(clicheName) %>';
  @Input() inputContentLabel = 'Content';
  @Input() new<%= classify(clicheName) %>SavedText = 'New <%= clicheName %> saved';

  @ViewChild(FormGroupDirective) form;

  contentControl = new FormControl('', Validators.required);
  create<%= classify(clicheName) %>Form: FormGroup = this.builder.group({
    contentControl: this.contentControl
  });


  new<%= classify(clicheName) %>Saved = false;
  new<%= classify(clicheName) %>Error: string;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, private builder: FormBuilder,
    @Inject(API_PATH) private apiPath) {}

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  onSubmit() {
    this.rs.exec(this.elem);
  }

  async dvOnExec(): Promise<void> {
    const res = await this.gs.post<Create<%= classify(clicheName) %>Res>(this.apiPath, {
      inputs: {
        input: {
          id: this.id,
          content: this.contentControl.value
        }
      },
      extraInfo: { returnFields: 'id' }
    })
    .toPromise();

    if (res.errors) {
      throw new Error(_.map(res.errors, 'message')
        .join());
    }
  }

  dvOnExecSuccess() {
    this.new<%= classify(clicheName) %>Saved = true;
    window.setTimeout(() => {
      this.new<%= classify(clicheName) %>Saved = false;
    }, SAVED_MSG_TIMEOUT);
    // Can't do `this.form.reset();`
    // See https://github.com/angular/material2/issues/4190
    if (this.form) {
      this.form.resetForm();
    }
  }

  dvOnExecFailure(reason: Error) {
    this.new<%= classify(clicheName) %>Error = reason.message;
  }
}
