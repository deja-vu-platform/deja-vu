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

import { API_PATH } from '../<%= dasherize(conceptName) %>.config';
import { <%= classify(conceptName) %> } from '../shared/<%= dasherize(conceptName) %>.model';


interface Create<%= classify(conceptName) %>Res {
  data: { create<%= classify(conceptName) %>: <%= classify(conceptName) %> };
  errors: { message: string }[];
}

const SAVED_MSG_TIMEOUT = 3000;

@Component({
  selector: '<%= dasherize(conceptName) %>-create-<%= dasherize(conceptName) %>',
  templateUrl: './create-<%= dasherize(conceptName) %>.component.html',
  styleUrls: ['./create-<%= dasherize(conceptName) %>.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: Create<%= classify(conceptName) %>Component,
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: Create<%= classify(conceptName) %>Component,
      multi: true
    }
  ]
})
export class Create<%= classify(conceptName) %>Component implements OnInit, OnExec, OnExecFailure,
  OnExecSuccess {
  @Input() id: string | undefined;
  @Input() set content(inputContent: string) {
    this.contentControl.setValue(inputContent);
  }
  @Input() showOptionToSubmit = true;

  // Presentation inputs
  @Input() buttonLabel = 'Create <%= classify(conceptName) %>';
  @Input() inputContentLabel = 'Content';
  @Input() new<%= classify(conceptName) %>SavedText = 'New <%= conceptName %> saved';

  @ViewChild(FormGroupDirective) form;

  contentControl = new FormControl('', Validators.required);
  create<%= classify(conceptName) %>Form: FormGroup = this.builder.group({
    contentControl: this.contentControl
  });


  new<%= classify(conceptName) %>Saved = false;
  new<%= classify(conceptName) %>Error: string;

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
    const res = await this.gs.post<Create<%= classify(conceptName) %>Res>(this.apiPath, {
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
    this.new<%= classify(conceptName) %>Saved = true;
    window.setTimeout(() => {
      this.new<%= classify(conceptName) %>Saved = false;
    }, SAVED_MSG_TIMEOUT);
    // Can't do `this.form.reset();`
    // See https://github.com/angular/material2/issues/4190
    if (this.form) {
      this.form.resetForm();
    }
  }

  dvOnExecFailure(reason: Error) {
    this.new<%= classify(conceptName) %>Error = reason.message;
  }
}
