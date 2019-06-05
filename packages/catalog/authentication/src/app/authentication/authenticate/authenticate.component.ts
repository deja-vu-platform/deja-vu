import {
  Component, ElementRef, Inject, Input, OnChanges, OnInit
} from '@angular/core';

import {
  GatewayService, GatewayServiceFactory, OnEval, OnExec, RunService,
  StorageService
} from '@deja-vu/core';


import * as _ from 'lodash';

import { API_PATH } from '../authentication.config';

import { User } from '../shared/authentication.model';


@Component({
  selector: 'authentication-authenticate',
  templateUrl: './authenticate.component.html',
  styleUrls: ['./authenticate.component.css']
})
export class AuthenticateComponent implements OnExec, OnEval, OnInit {
  @Input() id: string | undefined;
  @Input() user: User | undefined;
  isAuthenticated = false;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, @Inject(API_PATH) private apiPath,
    private ss: StorageService) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  dvOnEval() {
    return this.doAuthenticate();
  }

  dvOnExec() {
    return this.doAuthenticate();
  }

  doAuthenticate() {
    if (!this.gs || (_.isEmpty(this.id) && _.isEmpty(this.user))) {
      // this is essentialy failing the tx if there is one
      return this.gs.noRequest();
    }
    const token = this.ss.getItem(this.elem, 'token');
    this.gs.get<{ data: { verify: boolean } }>(this.apiPath, {
      params: {
        inputs: {
          input: {
            id: this.id ? this.id : this.user.id,
            token: token
          }
        }
      }
    })
      .subscribe((res) => {
        this.isAuthenticated = res.data.verify;
      });
  }
}
