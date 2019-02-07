import { Component, ElementRef, Input, OnInit } from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnExec, RunService
} from '@deja-vu/core';

import * as _ from 'lodash';

@Component({
  selector: 'group-delete-group',
  templateUrl: './delete-group.component.html',
  styleUrls: ['./delete-group.component.css']
})
export class DeleteGroupComponent implements OnInit, OnExec {
  @Input() id: string;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  deleteGroup() {
    this.rs.exec(this.elem);
  }

  async dvOnExec(): Promise<void> {
    const res = await this.gs
      .post<{ data: any, errors: { message: string }[] }>('/graphql', {
        inputs: { id: this.id }
      })
      .toPromise();

    if (res.errors) {
      throw new Error(_.map(res.errors, 'message')
        .join());
    }
  }
}
