import {
  Component, ElementRef, EventEmitter,
  Inject, Input, OnChanges, OnInit, Output
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnExec, RunService
} from 'dv-core';

import * as _ from 'lodash';

import { API_PATH } from '../authorization.config';


interface CanEditRes {
  data: { canEdit: boolean };
}

@Component({
  selector: 'authorization-can-edit',
  templateUrl: './can-edit.component.html',
  styleUrls: ['./can-edit.component.css']
})
export class CanEditComponent implements OnInit, OnChanges, OnExec {
  @Input() resourceId: string;
  @Input() principalId: string;
  @Output() canEdit = new EventEmitter<boolean>();
  _canEdit = false;

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
    if (!this.gs) {
      return;
    }
    this.gs.get<CanEditRes>(this.apiPath, {
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
      this._canEdit = res.data.canEdit;
      this.canEdit.emit(this._canEdit);
    });
  }

  dvOnExec() {
    this.load();
  }
}
