import {
  Component, ElementRef, EventEmitter,
  Inject, Input, OnChanges, OnInit, Output
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnExec, RunService
} from '@dejavu-lang/core';

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
export class CanViewComponent implements OnInit, OnChanges, OnExec {
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
    this.load();
  }

  ngOnChanges() {
    this.load();
  }

  load() {
    this.doRequest();
  }

  dvOnExec() {
    this.doRequest();
  }

  doRequest() {
    if (!this.gs) {
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
}
