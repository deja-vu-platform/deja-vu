import {
  Component, ElementRef, EventEmitter,
  Input, OnChanges, OnInit, Output
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnAfterAbort,
  OnAfterCommit, OnRun, RunService
} from 'dv-core';

import * as _ from 'lodash';

import { Principal } from '../../../../shared/authorization.model';


@Component({
  selector: 'authorization-show-owner',
  templateUrl: './show-owner.component.html',
  styleUrls: ['./show-owner.component.css']
})
export class ShowOwnerComponent implements OnInit, OnChanges {
  @Input() resourceId: string;
  @Output() owner = new EventEmitter<Principal>();

  ownerId: string | undefined;

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
    this.gs.get<{data: { owner: Principal }}>('/graphql', {
      params: {
        query: `query {
          owner(resourceId: "${this.resourceId}") {
            id
          }
        }`
      }
    })
    .subscribe((res) => {
      const owner = res.data.owner;
      this.ownerId = owner.id;
      this.owner.emit(owner);
    });
  }

}
