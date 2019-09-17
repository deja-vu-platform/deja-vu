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


interface CanViewRes {
  data: { canView: boolean; };
}

@Component({
  selector: 'authorization-can-view',
  templateUrl: './can-view.component.html',
  styleUrls: ['./can-view.component.css']
})
export class CanViewComponent implements
  AfterViewInit, OnInit, OnChanges, OnDestroy, OnEval, OnExec {
  @Input() waitOn: string[];
  @Input() resourceId: string;
  @Input() principalId: string;
  @Output() canView = new EventEmitter<boolean>();
  _canView = false;

  destroyed = new Subject<any>();

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
    this.router.events
      .pipe(
        filter((e: RouterEvent) => e instanceof NavigationEnd),
        takeUntil(this.destroyed))
      .subscribe(() => {
        this.load();
      });
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
    if (!this.canEval()) {
      return;
    }
    await this.ws.maybeWait();
    this.gs.get<CanViewRes>(this.apiPath, {
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
      this._canView = res.data.canView;
      this.canView.emit(this._canView);
    });
  }

  ngOnDestroy(): void {
    this.destroyed.next();
    this.destroyed.complete();
  }

  private canEval() {
    return this.gs && this.principalId && this.resourceId;
  }
}
