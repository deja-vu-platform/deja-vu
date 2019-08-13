import {
  Component, ElementRef, Inject, Input, OnInit
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnExec, RunService
} from '@deja-vu/core';

import * as _ from 'lodash';

import { API_PATH } from '../<%= dasherize(conceptName) %>.config';

interface Delete<%= classify(conceptName) %>Res {
  data: { delete<%= classify(conceptName) %>: boolean };
  errors: { message: string }[];
}

@Component({
  selector: '<%= dasherize(conceptName) %>-delete-<%= dasherize(conceptName) %>',
  templateUrl: './delete-<%= dasherize(conceptName) %>.component.html',
  styleUrls: ['./delete-<%= dasherize(conceptName) %>.component.css']
})
export class Delete<%= classify(conceptName) %>Component implements OnInit, OnExec {
  @Input() id: string;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, @Inject(API_PATH) private apiPath) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  delete<%= classify(conceptName) %>() {
    this.rs.exec(this.elem);
  }

  async dvOnExec() {
    const res = await this.gs.post<Delete<%= classify(conceptName) %>Res>(this.apiPath, {
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
