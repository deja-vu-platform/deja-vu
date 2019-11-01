import {
  AfterViewInit, Component, ElementRef, EventEmitter,
  Inject, Input, OnChanges, OnDestroy, OnInit, Output
} from '@angular/core';
import { DvService, DvServiceFactory, OnEval, OnExec } from '@deja-vu/core';

import * as _ from 'lodash';

import { API_PATH } from '../authorization.config';

import { CanDoRes } from '../shared/authorization.model';


@Component({
  selector: 'authorization-verify-can-view',
  templateUrl: './verify-can-view.component.html',
  styleUrls: ['./verify-can-view.component.css']
})
export class VerifyCanViewComponent implements
  OnInit, OnChanges, OnEval, OnExec {
  @Input() waitOn: string[];
  @Input() resourceId: string;
  @Input() principalId: string;
  @Output() canView = new EventEmitter<boolean>();
  _canView = false;

  private dvs: DvService;

  constructor(
    private elem: ElementRef, private dvf: DvServiceFactory,
    @Inject(API_PATH) private apiPath) {}

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .withDefaultWaiter()
      .build();
  }

  ngOnChanges(changes) {
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
    if (!this.dvs) {
      // this is essentialy failing the tx if there is one
      return this.dvs.noRequest();
    }
    const res = await this.dvs.waitAndGet<CanDoRes>(this.apiPath, () => ({
      params: {
        inputs: {
          input: {
            principalId: this.principalId,
            resourceId: this.resourceId
          }
        }
      }
    }));
    this._canView = res.data.canDo;
    this.canView.emit(this._canView);
  }
}
