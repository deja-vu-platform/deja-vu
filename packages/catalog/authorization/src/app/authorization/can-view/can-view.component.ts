import {
  AfterViewInit, Component, ElementRef, EventEmitter,
  Inject, Input, OnChanges, OnDestroy, OnInit, Output
} from '@angular/core';
import { DvService, DvServiceFactory, OnEval, OnExec } from '@deja-vu/core';

import * as _ from 'lodash';

import { API_PATH } from '../authorization.config';

import { CanDoRes } from '../shared/authorization.model';


@Component({
  selector: 'authorization-can-view',
  templateUrl: './can-view.component.html',
  styleUrls: ['./can-view.component.css']
})
export class CanViewComponent
  implements AfterViewInit, OnInit, OnChanges, OnDestroy, OnEval, OnExec {
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
      .withRefreshCallback(() => { this.load(); })
      .build();
  }

  ngAfterViewInit() {
    this.load();
  }

  ngOnChanges(changes) {
    if (this.dvs && this.dvs.waiter.processChanges(changes)) {
      this.load();
    }
  }

  load() {
    if (this.canEval()) {
      this.dvs.eval();
    }
  }

  dvOnEval() {
    return this.doRequest();
  }

  dvOnExec() {
    return this.doRequest();
  }

  async doRequest() {
    if (!this.canEval()) {
      return;
    }
    const res = await this.dvs.waitAndGet<CanDoRes>(this.apiPath, {
      params: {
        inputs: {
          input: {
            principalId: this.principalId,
            resourceId: this.resourceId
          }
        }
      }
    });
    this._canView = res.data.canDo;
    this.canView.emit(this._canView);
  }

  ngOnDestroy(): void {
    this.dvs.onDestroy();
  }

  private canEval() {
    return this.dvs && this.principalId && this.resourceId;
  }
}
