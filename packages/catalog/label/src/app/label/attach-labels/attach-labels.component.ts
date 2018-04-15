import { COMMA, ENTER } from '@angular/cdk/keycodes';
import {
  Component, ElementRef, EventEmitter, Input, OnInit, Output
} from '@angular/core';
import { MatChipInputEvent } from '@angular/material';

import {
  GatewayService, GatewayServiceFactory, OnAfterAbort, OnAfterCommit,
  OnRun, RunService
} from 'dv-core';

import * as _ from 'lodash';
import { Item, Label } from '../shared/label.model';

const SAVED_MSG_TIMEOUT = 3000;

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

  @Output() item: EventEmitter<Item> = new EventEmitter<Item>();

  labelsAttached = false;
  labelsAttachedError: string;

  // Enter, comma
  separatorKeysCodes = [ENTER, COMMA];

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService) { }

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
    const res = await this.gs.post<{
      data: {item: Item}, errors: { message: string }[]
    }>('/graphql', {
      query: `mutation AttachLabelsToItem($input: AddLabelsToItemInput!) {
            addLabelsToItem(input: $input) {
              id
            }
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

    this.item.emit(res.data.item);
  }

  dvOnAfterCommit() {
    this.labelsAttached = true;
    this.labelsAttachedError = '';
    window.setTimeout(() => {
      this.labelsAttached = false;
    }, SAVED_MSG_TIMEOUT);
  }

  dvOnAfterAbort(reason: Error) {
    this.labelsAttachedError = reason.message;
  }
}