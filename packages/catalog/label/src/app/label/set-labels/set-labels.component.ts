import { COMMA, ENTER } from '@angular/cdk/keycodes';
import {
  Component, ElementRef, EventEmitter, Inject, Input, OnInit
} from '@angular/core';
import { MatChipInputEvent } from '@angular/material';

import {
  GatewayService, GatewayServiceFactory, OnExec, OnExecFailure,
  OnExecSuccess, RunService
} from '@deja-vu/core';

import * as _ from 'lodash';

import { API_PATH } from '../label.config';
import { Label } from '../shared/label.model';

const SAVED_MSG_TIMEOUT = 3000;

interface SetLabelsOfItemRes {
  data: { setLabelsOfItem: boolean };
  errors: { message: string }[];
}

@Component({
  selector: 'label-set-labels',
  templateUrl: './set-labels.component.html',
  styleUrls: ['./set-labels.component.css']
})
export class SetLabelsComponent implements
  OnInit, OnExec, OnExecFailure, OnExecSuccess {
  @Input() itemId: string;
  @Input() labels: Label[] | undefined;

  @Input() visible = true;
  @Input() selectable = true;
  @Input() removable = true;
  @Input() addOnBlur = true;

  @Input() showOptionToSubmit = true;
  @Input() clearLabelsOnSave = true;

  // Presentation inputs
  @Input() inputLabel = 'Add label...';
  @Input() buttonLabel = 'Set Labels';
  @Input() labelsSetSavedText = 'Labels set';

  labelsSet = false;
  labelsSetError: string;

  // Enter, comma
  separatorKeysCodes = [ENTER, COMMA];

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, @Inject(API_PATH) private apiPath) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);

    if (_.isEmpty(this.labels)) {
      this.labels = [];
    }
  }

  onSubmit() {
    this.rs.exec(this.elem);
  }

  add(event: MatChipInputEvent): void {
    const input = event.input;
    const value = event.value;

    // Add our label
    if ((value || '').trim()) {
      this.labels.push({ id: value.trim() });
    }

    // Reset the input value
    if (input) {
      input.value = '';
    }
  }

  remove(label: any): void {
    const index = this.labels.indexOf(label);

    if (index >= 0) {
      this.labels.splice(index, 1);
    }
  }

  async dvOnExec(): Promise<void> {
    const res = await this.gs.post<SetLabelsOfItemRes>(this.apiPath, {
      inputs: {
        input: {
          itemId: this.itemId,
          labelIds: _.map(this.labels, 'id')
        }
      }
    })
      .toPromise();

    if (res.errors) {
      throw new Error(_.map(res.errors, 'message')
        .join());
    }
  }

  dvOnExecSuccess() {
    this.labelsSet = true;
    this.labelsSetError = '';
    if (this.clearLabelsOnSave) {
      this.labels = [];
    }
    window.setTimeout(() => {
      this.labelsSet = false;
    }, SAVED_MSG_TIMEOUT);
  }

  dvOnExecFailure(reason: Error) {
    this.labelsSetError = reason.message;
  }
}
