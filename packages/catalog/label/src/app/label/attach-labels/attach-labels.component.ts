import { COMMA, ENTER } from '@angular/cdk/keycodes';
import {
  Component, ElementRef, EventEmitter, Inject, Input, OnInit
} from '@angular/core';
import { MatChipInputEvent } from '@angular/material';

import {
  DvService, DvServiceFactory, OnExec, OnExecFailure, OnExecSuccess
} from '@deja-vu/core';

import * as _ from 'lodash';

import { API_PATH } from '../label.config';
import { Label } from '../shared/label.model';

const SAVED_MSG_TIMEOUT = 3000;

interface AddLabelsToItemRes {
  data: { addLabelsToItem: boolean };
  errors: { message: string }[];
}

@Component({
  selector: 'label-attach-labels',
  templateUrl: './attach-labels.component.html',
  styleUrls: ['./attach-labels.component.css']
})
export class AttachLabelsComponent
  implements OnInit, OnExec, OnExecFailure, OnExecSuccess {
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
  @Input() buttonLabel = 'Attach Labels';
  @Input() labelsAttachedSavedText = 'Labels attached to item';

  labelsAttached = false;
  labelsAttachedError: string;

  // Enter, comma
  separatorKeysCodes = [ENTER, COMMA];

  private dvs: DvService;

  constructor(
    private elem: ElementRef, private dvf: DvServiceFactory,
    @Inject(API_PATH) private apiPath) { }

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .build();

    if (_.isEmpty(this.labels)) {
      this.labels = [];
    }
  }

  onSubmit() {
    this.dvs.exec();
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
    const res = await this.dvs.post<AddLabelsToItemRes>(this.apiPath, {
      inputs: {
        input: {
          itemId: this.itemId,
          labelIds: _.map(this.labels, 'id')
        }
      }
    });

    if (res.errors) {
      throw new Error(_.map(res.errors, 'message')
        .join());
    }
  }

  dvOnExecSuccess() {
    this.labelsAttached = true;
    this.labelsAttachedError = '';
    if (this.clearLabelsOnSave) {
      this.labels = [];
    }
    window.setTimeout(() => {
      this.labelsAttached = false;
    }, SAVED_MSG_TIMEOUT);
  }

  dvOnExecFailure(reason: Error) {
    this.labelsAttachedError = reason.message;
  }
}
