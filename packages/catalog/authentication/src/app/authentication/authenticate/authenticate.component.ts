import {
  Component, ElementRef, EventEmitter, Inject,
  Input, OnChanges, OnInit, Output
} from '@angular/core';

import {
  GatewayService, GatewayServiceFactory, OnExec, RunService
} from '@deja-vu/core';

import { AuthenticationService } from '../shared/authentication.service';

import * as _ from 'lodash';

import { API_PATH } from '../authentication.config';

import { User } from '../shared/authentication.model';


@Component({
  selector: 'authentication-authenticate',
  templateUrl: './authenticate.component.html',
  styleUrls: ['./authenticate.component.css']
})
export class AuthenticateComponent implements OnExec, OnInit, OnChanges {
  @Input() id: string | undefined;
  @Input() user: User | undefined;
  isAuthenticated = false;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, @Inject(API_PATH) private apiPath,
    private authenticationService: AuthenticationService) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
    this.load();
  }

  ngOnChanges() {
    this.load();
  }

  load() {
    this.doRequest();
  }

  dvOnExec() {
    this.doRequest();
  }

  doRequest() {
    if (!this.gs || (_.isEmpty(this.id) && _.isEmpty(this.user))) {
      return;
    }
    const token = this.authenticationService.getToken();
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
