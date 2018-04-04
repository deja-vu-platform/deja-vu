import {
  Component, ElementRef, EventEmitter,
  Input, OnChanges, OnInit, Output
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnAfterAbort,
  OnAfterCommit, OnRun, RunService
} from 'dv-core';

import * as _ from 'lodash';

import { AuthenticationService } from '../shared/authentication.service';


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
    if (!this.gs) {
      return;
    }
    const token = this.authenticationService.getToken();
    this.gs.get<{data: { verify: boolean }}>('/graphql', {
      params: {
        query: `query {
          verify(id: "${this.id}", token: "${token}")
        }`
      }
    })
    .subscribe((res) => {
      this.isAuthenticated = res.data.verify;
    });
  }

  dvOnRun() {
    this.load();
  }
}
