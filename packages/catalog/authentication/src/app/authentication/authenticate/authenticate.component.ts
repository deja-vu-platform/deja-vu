import {
  Component, ElementRef, EventEmitter, Inject,
  Input, OnChanges, OnInit, Output
} from '@angular/core';

import {
  GatewayService, GatewayServiceFactory, OnAfterAbort,
  OnAfterCommit, OnRun, RunService
} from 'dv-core';

import { AuthenticationService } from '../shared/authentication.service';

import * as _ from 'lodash';

import { API_PATH } from '../authentication.config';


@Component({
  selector: 'authentication-authenticate',
  templateUrl: './authenticate.component.html',
  styleUrls: ['./authenticate.component.css']
})
export class AuthenticateComponent implements OnInit, OnChanges {
  @Input() id: string;
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
    if (!this.gs || _.isEmpty(this.id)) {
      return;
    }
    const token = this.authenticationService.getToken();
    this.gs.get<{ data: { verify: boolean } }>(this.apiPath, {
      params: {
        query: `query Verify($input: VerifyInput!){
          verify(input: $input)
        }`,
        variables: JSON.stringify({
          input: {
            id: this.id,
            token: token
          }
        })
      }
    })
    .subscribe((res) => {
      this.isAuthenticated = res.data.verify;
    });
  }

  dvOnRun() {
    const token = this.authenticationService.getToken();
    this.gs.post<{ data: { verify: boolean } }>(this.apiPath, {
      query: `mutation Verify($input: VerifyInput!) {
        verify(input: $input)
      }`,
      variables: {
        input: {
          id: this.id,
          token: token
        }
      }
    })
    .subscribe((res) => {
      this.isAuthenticated = res.data.verify;
    });
  }
}
