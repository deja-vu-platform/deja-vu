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
import { <%= classify(entityName) %> } from '../shared/<%= dasherize(clicheName) %>.model';


interface <%= classify(componentName) %>Res {
  data: { <%= camelize(componentName) %>: <%= classify(entityName) %> };
  errors: { message: string }[];
}

const SAVED_MSG_TIMEOUT = 3000;

@Component({
  selector: '<%= dasherize(clicheName) %>-<%= dasherize(componentName) %>',
  templateUrl: './<%= dasherize(componentName) %>.component.html',
  styleUrls: ['./<%= dasherize(componentName) %>.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: <%= classify(componentName) %>Component,
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: <%= classify(componentName) %>Component,
      multi: true
    }
  ]
})
export class <%= classify(componentName) %>Component implements OnInit, OnExec, OnExecFailure,
  OnExecSuccess {
  @Input() id: string | undefined;
  @Input() set content(inputContent: string) {
    this.contentControl.setValue(inputContent);
  }
  @Input() showOptionToSubmit = true;

  // Presentation inputs
  @Input() buttonLabel = 'Create <%= classify(entityName) %>';
  @Input() inputContentLabel = 'Content';
  @Input() new<%= classify(entityName) %>SavedText = 'New <%= entityName %> saved';

  @ViewChild(FormGroupDirective) form;

  contentControl = new FormControl('', Validators.required);
  <%= camelize(componentName) %>Form: FormGroup = this.builder.group({
    contentControl: this.contentControl
  });


  new<%= classify(entityName) %>Saved = false;
  new<%= classify(entityName) %>Error: string;

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
    const res = await this.gs.post<<%= classify(componentName) %>Res>(this.apiPath, {
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
    this.new<%= classify(entityName) %>Saved = true;
    window.setTimeout(() => {
      this.new<%= classify(entityName) %>Saved = false;
    }, SAVED_MSG_TIMEOUT);
    // Can't do `this.form.reset();`
    // See https://github.com/angular/material2/issues/4190
    if (this.form) {
      this.form.resetForm();
    }
  }

  dvOnExecFailure(reason: Error) {
    this.new<%= classify(entityName) %>Error = reason.message;
  }
}
