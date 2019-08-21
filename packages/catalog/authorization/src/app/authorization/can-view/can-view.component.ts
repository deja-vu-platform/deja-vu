import {
  AfterViewInit, Component, ElementRef, EventEmitter,
  Inject, Input, OnChanges, OnInit, Output
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnExec, RunService
} from '@deja-vu/core';

import * as _ from 'lodash';

import { API_PATH } from '../authorization.config';


interface CanViewRes {
  data: { canView: boolean; };
}

@Component({
  selector: 'authorization-can-view',
  templateUrl: './can-view.component.html',
  styleUrls: ['./can-view.component.css']
})
export class CanViewComponent implements
  AfterViewInit, OnInit, OnChanges, OnExec {
  @Input() resourceId: string;
  @Input() principalId: string;
  @Output() canView = new EventEmitter<boolean>();
  _canView = false;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, @Inject(API_PATH) private apiPath) {}

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  ngAfterViewInit() {
    this.load();
  }

  ngOnChanges() {
    this.load();
  }

  load() {
    if (this.canEval()) {
      this.rs.eval(this.elem);
    }
  }

  dvOnEval() {
    this.doRequest();
  }

  dvOnExec() {
    this.doRequest();
  }

  doRequest() {
    if (!this.canEval()) {
      return;
    }
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

  canEval() {
    return this.gs && this.principalId && this.resourceId;
  }
}
