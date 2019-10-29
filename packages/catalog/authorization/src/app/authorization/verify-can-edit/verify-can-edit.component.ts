import {
  Component, ElementRef, EventEmitter, Inject, Input, OnChanges, OnInit,
  SimpleChanges
} from '@angular/core';

import { DvService, DvServiceFactory, OnEval, OnExec } from '@deja-vu/core';

import * as _ from 'lodash';

import { API_PATH } from '../authorization.config';

import { CanDoRes } from '../shared/authorization.model';


@Component({
  selector: 'authorization-verify-can-edit',
  templateUrl: './verify-can-edit.component.html',
  styleUrls: ['./verify-can-edit.component.css']
})
export class VerifyCanEditComponent implements OnExec, OnEval, OnInit,
  OnChanges {
  // A list of fields to wait for
  @Input() waitOn: string[] = [];

  @Input() resourceId: string;
  @Input() principalId: string;

  canEdit;
  private dvs: DvService;

  constructor(
    private elem: ElementRef, private dvf: DvServiceFactory,
    @Inject(API_PATH) private apiPath) {}

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .withDefaultWaiter()
      .build();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.dvs) {
      this.dvs.waiter.processChanges(changes);
    }
  }

  dvOnEval() {
    return this.doAuthorize();
  }

  dvOnExec() {
    return this.doAuthorize();
  }

  async doAuthorize() {
    if (!this.dvs || (
      _.isEmpty(this.principalId) && _.isEmpty(this.resourceId) &&
      _.isEmpty(this.waitOn))) {
      // this is essentialy failing the tx if there is one
      return this.dvs.noRequest();
    }
    const res = await this.dvs.waitAndGet<CanDoRes>(this.apiPath, {
      params: {
        inputs: JSON.stringify({
          input: {
            principalId: this.principalId,
            resourceId: this.resourceId
          }
        })
      }
    });
    this.canEdit = res.data.canDo;
  }
}
