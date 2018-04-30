import {
  Component, ElementRef, Inject, Input, OnInit
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnRun, RunService
} from 'dv-core';

import * as _ from 'lodash';

import { API_PATH } from '../authorization.config';


@Component({
  selector: 'authorization-delete-resource',
  templateUrl: './delete-resource.component.html',
  styleUrls: ['./delete-resource.component.css']
})
export class DeleteResourceComponent implements OnInit, OnRun {
  @Input() id;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, @Inject(API_PATH) private apiPath) {}

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  deleteEvent() {
    this.rs.run(this.elem);
  }

  dvOnRun() {
    this.gs
      .post(this.apiPath, {
        query: `mutation {
          deleteResource (id: "${this.id}")
        }`
      })
      .toPromise();
  }
}
