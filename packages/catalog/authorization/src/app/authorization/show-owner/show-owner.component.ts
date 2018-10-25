import {
  Component, ElementRef, EventEmitter,
  Inject, Input, OnChanges, OnInit, Output
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, RunService
} from 'dv-core';

import * as _ from 'lodash';

import { Resource } from '../shared/authorization.model';

import { API_PATH } from '../authorization.config';


@Component({
  selector: 'authorization-show-owner',
  templateUrl: './show-owner.component.html',
  styleUrls: ['./show-owner.component.css']
})
export class ShowOwnerComponent implements OnInit, OnChanges {
  @Input() resourceId: string;
  @Output() ownerId = new EventEmitter<string>();

  _ownerId: string | undefined;

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
    this.gs.get<{data: { owner: string }}>(this.apiPath, {
      params: {
        query: `query {
          owner(resourceId: "${this.resourceId}")
        }`
      }
    })
    .subscribe((res) => {
      const ownerId = res.data.owner;
      this._ownerId = ownerId;
      this.ownerId.emit(ownerId);
    });
  }

}
