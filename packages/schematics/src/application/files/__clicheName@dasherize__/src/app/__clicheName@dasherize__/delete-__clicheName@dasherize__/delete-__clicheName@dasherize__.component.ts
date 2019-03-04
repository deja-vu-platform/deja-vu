import {
  Component, ElementRef, Inject, Input, OnInit
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnExec, RunService
} from '@deja-vu/core';

import * as _ from 'lodash';

import { API_PATH } from '../<%= dasherize(clicheName) %>.config';

interface Delete<%= classify(clicheName) %>Res {
  data: { delete<%= classify(clicheName) %>: boolean };
  errors: { message: string }[];
}

@Component({
  selector: '<%= dasherize(clicheName) %>-delete-<%= dasherize(clicheName) %>',
  templateUrl: './delete-<%= dasherize(clicheName) %>.component.html',
  styleUrls: ['./delete-<%= dasherize(clicheName) %>.component.css']
})
export class Delete<%= classify(clicheName) %>Component implements OnInit, OnExec {
  @Input() id: string;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, @Inject(API_PATH) private apiPath) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  delete<%= classify(clicheName) %>() {
    this.rs.exec(this.elem);
  }

  async dvOnExec() {
    const res = await this.gs.post<Delete<%= classify(clicheName) %>Res>(this.apiPath, {
        inputs: {
          id: this.id
        }
      })
      .toPromise();

      if (res.errors) {
        throw new Error(_.map(res.errors, 'message')
          .join());
      }
  }
}
