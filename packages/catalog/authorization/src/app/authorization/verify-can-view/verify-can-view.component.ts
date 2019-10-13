import {
  AfterViewInit, Component, ElementRef, EventEmitter,
  Inject, Input, OnChanges, OnDestroy, OnInit, Output
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnEval, OnExec, RunService,
  WaiterService, WaiterServiceFactory
} from '@deja-vu/core';

import * as _ from 'lodash';

import { NavigationEnd, Router, RouterEvent } from '@angular/router';
import { Subject } from 'rxjs/Subject';

import { API_PATH } from '../authorization.config';

import { filter, take, takeUntil } from 'rxjs/operators';

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

  private gs: GatewayService;
  private ws: WaiterService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private wsf: WaiterServiceFactory, private router: Router,
    private rs: RunService, @Inject(API_PATH) private apiPath) {}

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
    this.ws = this.wsf.for(this, this.waitOn);
  }

  ngOnChanges(changes) {
    if (this.ws) {
      this.ws.processChanges(changes);
    }
  }

  dvOnEval() {
    return this.doAuthorize();
  }

  dvOnExec() {
    return this.doAuthorize();
  }

  async doAuthorize() {
    if (!this.gs) {
      // this is essentialy failing the tx if there is one
      return this.gs.noRequest();
    }
    await this.ws.maybeWait();
    this.gs.get<CanDoRes>(this.apiPath, {
      params: {
        inputs: {
          input: {
            principalId: this.principalId,
            resourceId: this.resourceId
          }
        }
      }
    })
    .subscribe((res) => {
      this._canView = res.data.canDo;
      this.canView.emit(this._canView);
    });
  }
}
