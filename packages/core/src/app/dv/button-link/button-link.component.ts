import { Component, ElementRef, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OnExecSuccess, RunService } from '../run.service';

import * as _ from 'lodash';


@Component({
  selector: 'dv-button-link',
  templateUrl: './button-link.component.html'
})
export class ButtonLinkComponent implements OnInit, OnExecSuccess {
  @Input() valid = true;
  @Input() value: string | undefined;
  // see https://material.angular.io/components/button/examples
  @Input() color: 'basic' | 'primary' | 'accent' | 'warn' = 'basic';

  @Input() href: string | undefined;
  @Input() params;
  @Input() hardRefresh = false;

  aHref: string;

  constructor(
    private elem: ElementRef, private rs: RunService,
    private router: Router) {}

  ngOnInit() {
    this.rs.register(this.elem, this);
    this.setHref();
  }

  // should match dv.redirect, dv.link
  ngOnChanges() {
    this.setHref();
  }

  setHref() {
    if (this.href === undefined) {
      this.aHref = this.router.url.toString();
    } else {
      const newParams = _.mapValues(this.params, JSON.stringify);
      const url = this.router
        .createUrlTree([this.href], { queryParams: newParams });
      this.aHref = url.toString();
    }
  }

  onClick() {
    this.rs.exec(this.elem);
  }

  dvOnExecSuccess() {
    if (this.hardRefresh) {
      console.log(`dv.button-link causing a hard redirect to ${this.aHref}`);
      window.location.href = this.aHref;
    } else {
      console.log(`dv.button-link causing a redirect to ${this.aHref}`);
      this.router.navigateByUrl(this.aHref);
    }
  }
}
