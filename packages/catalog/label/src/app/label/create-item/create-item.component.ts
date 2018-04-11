import {
  Component, ElementRef, EventEmitter, Input, OnInit, Output
} from '@angular/core';

import {
  GatewayService, GatewayServiceFactory, OnAfterAbort, OnAfterCommit,
  OnRun, RunService
} from 'dv-core';

import * as _ from 'lodash';
import { Item } from '../shared/label.model';

const SAVED_MSG_TIMEOUT = 3000;


@Component({
  selector: 'label-create-item',
  templateUrl: './create-item.component.html',
  styleUrls: ['./create-item.component.css']
})
export class CreateItemComponent implements
  OnInit, OnRun, OnAfterAbort, OnAfterCommit {
  @Input() id: string | undefined;
  @Input() buttonLabel = 'Create Item';

  @Input() showOptionToSubmit = true;

  // Presentation inputs
  @Input() inputLabel = 'Item Id';
  @Input() newItemSavedText = 'New item saved';

  @Output() item: EventEmitter<Item> = new EventEmitter<Item>();

  newItemSaved = false;
  newItemError: string;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  onSubmit() {
    this.rs.run(this.elem);
  }

  async dvOnRun(): Promise<void> {
    const res = await this.gs.post<{
      data: { createItem: { id: string } }, errors: { message: string }[]
    }>('/graphql', {
      query: `mutation {
        createItem(id: "${this.id}") {
          id
        }
      }`
    })
      .toPromise();

    if (res.errors) {
      throw new Error(_.map(res.errors, 'message')
        .join());
    }

    this.item.emit({ id: res.data.createItem.id });
  }

  dvOnAfterCommit() {
    this.newItemSaved = true;
    this.newItemError = '';
    window.setTimeout(() => {
      this.newItemSaved = false;
    }, SAVED_MSG_TIMEOUT);
    this.id = '';
  }

  dvOnAfterAbort(reason: Error) {
    this.newItemError = reason.message;
  }
}
