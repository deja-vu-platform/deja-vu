import {
  Component, ElementRef, EventEmitter, Input, OnInit, Output
} from '@angular/core';

import {
  GatewayService, GatewayServiceFactory, OnAfterAbort, OnAfterCommit,
  OnRun, RunService
} from 'dv-core';

import * as _ from 'lodash';
import { Target } from '../shared/comment.model';

const SAVED_MSG_TIMEOUT = 3000;


@Component({
  selector: 'comment-create-target',
  templateUrl: './create-target.component.html',
  styleUrls: ['./create-target.component.css']
})
export class CreateTargetComponent implements
  OnInit, OnRun, OnAfterAbort, OnAfterCommit {
  @Input() id: string | undefined;
  @Input() buttonLabel = 'Create Target';

  @Input() showOptionToSubmit = true;

  // Presentation inputs
  @Input() inputLabel = 'Target Id';
  @Input() newTargetSavedText = 'New target saved';

  @Output() target: EventEmitter<Target> = new EventEmitter<Target>();

  newTargetSaved = false;
  newTargetError: string;

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
      data: { createTarget: { id: string } }, errors: { message: string }[]
    }>('/graphql', {
      query: `mutation {
            createTarget(id: "${this.id}") {
              id
            }
          }`
    })
      .toPromise();

    if (res.errors) {
      throw new Error(_.map(res.errors, 'message')
        .join());
    }

    this.target.emit({ id: res.data.createTarget.id });
  }

  dvOnAfterCommit() {
    this.newTargetSaved = true;
    this.newTargetError = '';
    window.setTimeout(() => {
      this.newTargetSaved = false;
    }, SAVED_MSG_TIMEOUT);
    this.id = '';
  }

  dvOnAfterAbort(reason: Error) {
    this.newTargetError = reason.message;
  }
}
