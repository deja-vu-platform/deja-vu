import {
  Component, ElementRef, EventEmitter, Input, OnInit, Output
} from '@angular/core';

import {
  GatewayService, GatewayServiceFactory, OnAfterAbort, OnAfterCommit,
  OnRun, RunService
} from 'dv-core';

import * as _ from 'lodash';
import { Label } from '../shared/label.model';

const SAVED_MSG_TIMEOUT = 3000;


@Component({
  selector: 'label-create-label',
  templateUrl: './create-label.component.html',
  styleUrls: ['./create-label.component.css']
})
export class CreateLabelComponent implements
  OnInit, OnRun, OnAfterAbort, OnAfterCommit {
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
      data: { createLabel: { id: string } }, errors: { message: string }[]
    }>('/graphql', {
      query: `mutation {
          createLabel(id: "${this.id}") {
            id
          }
        }`
    })
      .toPromise();

    if (res.errors) {
      throw new Error(_.map(res.errors, 'message')
        .join());
    }

    this.label.emit({ id: res.data.createLabel.id });
  }

  dvOnAfterCommit() {
    this.newLabelSaved = true;
    this.newLabelError = '';
    window.setTimeout(() => {
      this.newLabelSaved = false;
    }, SAVED_MSG_TIMEOUT);
    this.id = '';
  }

  dvOnAfterAbort(reason: Error) {
    this.newLabelError = reason.message;
  }
}
