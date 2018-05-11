import { COMMA, ENTER } from '@angular/cdk/keycodes';
import {
  Component, ElementRef, EventEmitter, Inject, Input, OnInit
} from '@angular/core';
import { MatChipInputEvent } from '@angular/material';

import {
  GatewayService, GatewayServiceFactory, OnAfterAbort, OnAfterCommit,
  OnRun, RunService
} from 'dv-core';

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
export class AttachLabelsComponent implements
  OnInit, OnRun, OnAfterAbort, OnAfterCommit {
  @Input() itemId: string;
  @Input() labels: Label[] | undefined;

  @Input() visible = true;
  @Input() selectable = true;
  @Input() removable = true;
  @Input() addOnBlur = true;

  @Input() showOptionToSubmit = true;

  // Presentation inputs
  @Input() inputLabel = 'Add label...';
  @Input() buttonLabel = 'Attach Labels';
  @Input() labelsAttachedSavedText = 'Labels attached to item';

  labelsAttached = false;
  labelsAttachedError: string;

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
    this.rs.run(this.elem);
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

  async dvOnRun(): Promise<void> {
    const res = await this.gs.post<AddLabelsToItemRes>(this.apiPath, {
      query: `mutation AttachLabelsToItem($input: AddLabelsToItemInput!) {
            addLabelsToItem(input: $input)
          }`,
      variables: {
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

  dvOnAfterCommit() {
    this.labelsAttached = true;
    this.labelsAttachedError = '';
    this.labels = [];
    window.setTimeout(() => {
      this.labelsAttached = false;
    }, SAVED_MSG_TIMEOUT);
  }

  dvOnAfterAbort(reason: Error) {
    this.labelsAttachedError = reason.message;
  }
}
