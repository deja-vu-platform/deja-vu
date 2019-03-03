import {
  Component, ElementRef, Inject, Input, OnInit
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnExec, RunService
} from '@deja-vu/core';

import * as _ from 'lodash';

import { API_PATH } from '../<%= dasherize(clicheName) %>.config';

interface <%= classify(actionName) %>Res {
  data: { <%= camelize(actionName) %>: boolean };
  errors: { message: string }[];
}

@Component({
  selector: '<%= dasherize(clicheName) %>-<%= dasherize(actionName) %>',
  templateUrl: './<%= dasherize(actionName) %>.component.html',
  styleUrls: ['./<%= dasherize(actionName) %>.component.css']
})
export class <%= classify(actionName) %>Component implements OnInit, OnExec {
  @Input() id: string;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, @Inject(API_PATH) private apiPath) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  <%= camelize(actionName) %>() {
    this.rs.exec(this.elem);
  }

  async dvOnExec() {
    const res = await this.gs.post<<%= classify(actionName) %>Res>(this.apiPath, {
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
