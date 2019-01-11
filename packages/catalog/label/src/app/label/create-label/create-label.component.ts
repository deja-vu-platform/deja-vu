import {
  Component, ElementRef, EventEmitter, Inject, Input, OnInit, Output
} from '@angular/core';

import {
  GatewayService, GatewayServiceFactory, OnExec, OnExecFailure,
  OnExecSuccess, RunService
} from 'dv-core';

import * as _ from 'lodash';

import { API_PATH } from '../label.config';
import { Label } from '../shared/label.model';

interface CreateLabelRes {
  data: { createLabel: Label };
  errors: { message: string }[];
}

const SAVED_MSG_TIMEOUT = 3000;

@Component({
  selector: 'label-create-label',
  templateUrl: './create-label.component.html',
  styleUrls: ['./create-label.component.css']
})
export class CreateLabelComponent implements
  OnInit, OnExec, OnExecFailure, OnExecSuccess {
  @Input() id: string | undefined;
  @Input() buttonLabel = 'Create Label';

  @Input() showOptionToSubmit = true;

  // Presentation inputs
  @Input() inputLabel = 'Label Id';
  @Input() newLabelSavedText = 'New label saved';

  @Output() label: EventEmitter<Label> = new EventEmitter<Label>();

  newLabelSaved = false;
  newLabelError: string;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, @Inject(API_PATH) private apiPath) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  onSubmit() {
    this.rs.exec(this.elem);
  }

  async dvOnExec(): Promise<void> {
    const res = await this.gs.post<CreateLabelRes>(this.apiPath, {
        inputs: { id: this.id },
        extraInfo: { returnFields: 'id' }
    })
      .toPromise();

    if (res.errors) {
      throw new Error(_.map(res.errors, 'message')
        .join());
    }

    this.label.emit(res.data.createLabel);
  }

  dvOnExecSuccess() {
    this.newLabelSaved = true;
    this.newLabelError = '';
    window.setTimeout(() => {
      this.newLabelSaved = false;
    }, SAVED_MSG_TIMEOUT);
    this.id = '';
  }

  dvOnExecFailure(reason: Error) {
    this.newLabelError = reason.message;
  }
}
