import { Component, ElementRef, Input, OnInit } from '@angular/core';
import { OnExec, RunService } from '@deja-vu/core';

import * as _ from 'lodash';

import { PasskeyService } from '../shared/passkey.service';

@Component({
  selector: 'passkey-sign-out',
  templateUrl: './sign-out.component.html',
  styleUrls: ['./sign-out.component.css']
})
export class SignOutComponent implements OnInit, OnExec {
  @Input() buttonLabel = 'Sign Out';

  constructor(
    private elem: ElementRef, private rs: RunService,
    private passkeyService: PasskeyService) { }

  ngOnInit() {
    this.rs.register(this.elem, this);
  }

  signOut() {
    this.rs.exec(this.elem);
  }

  dvOnExec() {
    this.passkeyService.signOut();
  }
}
