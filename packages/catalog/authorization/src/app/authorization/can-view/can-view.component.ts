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
  selector: 'authorization-can-view',
  templateUrl: './can-view.component.html',
  styleUrls: ['./can-view.component.css']
})
export class CanViewComponent implements OnInit, OnChanges {
  @Input() resourceId: string;
  @Input() principalId: string;
  @Output() canView = new EventEmitter<boolean>();
  _canView = false;

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
    this.gs.get<{data: { canView: boolean }}>('/graphql', {
      params: {
        query: `
          query CanView($input: PrincipalResourceInput!) {
            canView(input: $input)
          }
        `,
        variables: JSON.stringify({
          input: {
            principalId: this.principalId,
            resourceId: this.resourceId
          }
        })
      }
    })
    .subscribe((res) => {
      this._canView = res.data.canView;
      this.canView.emit(this._canView);
    });
  }
}
