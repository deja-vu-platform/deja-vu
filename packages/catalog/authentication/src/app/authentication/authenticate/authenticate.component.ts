import {
  Component, ElementRef, EventEmitter,
  Input, OnChanges, OnInit, Output
} from '@angular/core';

import {
  GatewayService, GatewayServiceFactory, OnAfterAbort,
  OnAfterCommit, OnRun, RunService
} from 'dv-core';

import { AuthenticationService } from '../shared/authentication.service';

import * as _ from 'lodash';


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
    private rs: RunService,
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
    this.gs.get<{ data: { verify: boolean } }>('/graphql', {
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
    this.gs.post<{ data: { verify: boolean } }>('/graphql', {
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
