import { Component, ElementRef, Input, OnInit } from '@angular/core';
import { DvService, DvServiceFactory, OnExec } from '@deja-vu/core';

import * as _ from 'lodash';


@Component({
  selector: 'authentication-sign-out',
  templateUrl: './sign-out.component.html',
  styleUrls: ['./sign-out.component.css']
})
export class SignOutComponent implements OnInit, OnExec {
  @Input() buttonLabel = 'Sign Out';

  private dvs: DvService;

  constructor(
    private readonly elem: ElementRef,
    private readonly dvf: DvServiceFactory) {}

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .build();
  }

  signOut() {
    this.dvs.exec();
  }

  dvOnExec() {
    this.dvs.removeItems('token', 'user');
  }
}
