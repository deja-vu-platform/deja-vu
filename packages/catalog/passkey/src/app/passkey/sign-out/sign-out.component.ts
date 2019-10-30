import { Component, ElementRef, Input, OnInit } from '@angular/core';
import { OnExec, RunService, StorageService } from '@deja-vu/core';

import * as _ from 'lodash';


@Component({
  selector: 'passkey-sign-out',
  templateUrl: './sign-out.component.html',
  styleUrls: ['./sign-out.component.css']
})
export class SignOutComponent implements OnInit, OnExec {
  @Input() buttonLabel = 'Sign Out';

  constructor(
    private readonly elem: ElementRef, private readonly rs: RunService,
    private readonly ss: StorageService) {}

  ngOnInit() {
    this.rs.register(this.elem, this);
  }

  signOut() {
    this.rs.exec(this.elem);
  }

  dvOnExec() {
    this.ss.removeItem(this.elem, 'token');
    this.ss.removeItem(this.elem, 'passkey');
  }
}
