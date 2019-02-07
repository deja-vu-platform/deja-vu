import {
  Component, ElementRef, Inject, Input, OnInit
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnExec, RunService
} from '@deja-vu/core';

import * as _ from 'lodash';

import { API_PATH } from '../authorization.config';


@Component({
  selector: 'authorization-delete-resource',
  templateUrl: './delete-resource.component.html',
  styleUrls: ['./delete-resource.component.css']
})
export class DeleteResourceComponent implements OnInit, OnExec {
  @Input() id: string;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, @Inject(API_PATH) private apiPath) {}

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  deleteResource() {
    this.rs.exec(this.elem);
  }

  dvOnExec() {
    this.gs
      .post(this.apiPath, {
        inputs: { id: this.id }
      })
      .toPromise();
  }
}
