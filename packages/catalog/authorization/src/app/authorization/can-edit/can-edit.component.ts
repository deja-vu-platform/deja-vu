import {
  Component, ElementRef, EventEmitter,
  Input, OnChanges, OnInit, Output
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnAfterAbort,
  OnAfterCommit, OnRun, RunService
} from 'dv-core';

import * as _ from 'lodash';


@Component({
  selector: 'authorization-can-edit',
  templateUrl: './can-edit.component.html',
  styleUrls: ['./can-edit.component.css']
})
export class CanEditComponent implements OnInit, OnChanges {
  @Input() resourceId: string;
  @Input() principalId: string;
  @Output() canEdit = new EventEmitter<boolean>();
  _canEdit = false;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService) { }

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
    this.gs.get<{data: { canEdit: boolean }}>('/graphql', {
      params: {
        query: `query {
          canEdit(
            principalId: "${this.principalId}",
            resourceId: "${this.resourceId}")
        }`
      }
    })
    .subscribe((res) => {
      this._canEdit = res.data.canEdit;
      this.canEdit.emit(this._canEdit);
    });
  }

  dvOnRun() {
    this.load();
  }
}