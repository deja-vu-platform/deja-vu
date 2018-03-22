import {
  Component, ElementRef, EventEmitter,
  Input, OnInit
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnRun, RunService
} from 'dv-core';

import * as _ from 'lodash';

@Component({
  selector: 'authentication-sign-out',
  templateUrl: './sign-out.component.html',
  styleUrls: ['./sign-out.component.css']
})
export class SignOutComponent implements OnInit, OnRun {
  // TODO: Specify id to logout -> useful for guest functionality

  @Input() href: string;
  @Input() buttonLabel = 'Sign Out';

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  onSubmit() {
    this.rs.run(this.elem);
  }

  dvOnRun() {
    this.removeTokens();
  }

  removeTokens() {
    localStorage.removeItem('id_token');
    localStorage.removeItem('user_id');
  }

}
