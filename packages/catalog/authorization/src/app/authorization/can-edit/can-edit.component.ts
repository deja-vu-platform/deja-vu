import {
  AfterViewInit, Component, ElementRef, EventEmitter,
  Inject, Input, OnChanges, OnInit, Output
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnExec, RunService,
  WaiterService, WaiterServiceFactory
} from '@deja-vu/core';

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

  private gs: GatewayService;
  private ws: WaiterService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private wsf: WaiterServiceFactory, private rs: RunService,
    @Inject(API_PATH) private apiPath) {}

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
    this.ws = this.wsf.for(this, this.waitOn);
  }

  ngAfterViewInit() {
    this.load();
  }

  ngOnChanges(changes) {
    if (this.ws && this.ws.processChanges(changes)) {
      this.load();
    }
  }

  load() {
    if (this.canEval()) {
      this.rs.eval(this.elem);
    }
  }

  dvOnEval() {
    return this.doRequest();
  }

  dvOnExec() {
    return this.doRequest();
  }

  async doRequest() {
    if (!this.gs) {
      return;
    }
    await this.ws.maybeWait();
    this.gs.get<CanDoRes>(this.apiPath, {
      params: {
        inputs: JSON.stringify({
          input: {
            principalId: this.principalId,
            resourceId: this.resourceId
          }
        })
      }
    })
    .subscribe((res) => {
      this._canEdit = res.data.canDo;
      this.canEdit.emit(this._canEdit);
    });
  }

  canEval() {
    return this.gs && this.principalId && this.resourceId;
  }
}
