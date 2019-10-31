import {
  AfterViewInit, Component, ElementRef, EventEmitter,
  Inject, Input, OnChanges, OnInit, Output
} from '@angular/core';
import { DvService, DvServiceFactory, OnExec } from '@deja-vu/core';

import * as _ from 'lodash';

import { API_PATH } from '../authorization.config';

import { CanDoRes } from '../shared/authorization.model';


@Component({
  selector: 'authorization-can-edit',
  templateUrl: './can-edit.component.html',
  styleUrls: ['./can-edit.component.css']
})
export class CanEditComponent implements
  AfterViewInit, OnInit, OnChanges, OnExec {
  @Input() waitOn: string[];
  @Input() resourceId: string;
  @Input() principalId: string;
  @Output() canEdit = new EventEmitter<boolean>();
  _canEdit = false;

  private dvs: DvService;

  constructor(
    private elem: ElementRef, private dvf: DvServiceFactory,
    @Inject(API_PATH) private apiPath) {}

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .withDefaultWaiter()
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
    if (!this.dvs) {
      return;
    }
    const res = await this.dvs.waitAndGet<CanDoRes>(this.apiPath, () => ({
      params: {
        inputs: JSON.stringify({
          input: {
            principalId: this.principalId,
            resourceId: this.resourceId
          }
        })
      }
    }));
    this._canEdit = res.data.canDo;
    this.canEdit.emit(this._canEdit);
  }

  canEval() {
    return this.dvs && this.principalId && this.resourceId;
  }
}
