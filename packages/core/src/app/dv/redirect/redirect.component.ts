import { Component, ElementRef, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OnEvalFailure, OnExecFailure, RunService } from '../run.service';

import * as _ from 'lodash';


@Component({
  selector: 'dv-redirect',
  templateUrl: './redirect.component.html'
})
export class RedirectComponent
implements OnInit, OnEvalFailure, OnExecFailure {
  // TODO: rename this to path
  @Input() href: string;
  @Input() params;
  @Input() onEvalSuccess = false;
  @Input() onEvalFailure = false;
  @Input() onExecSuccess = false;
  @Input() onExecFailure = false;

  aHref: string;

  constructor(
    private elem: ElementRef, private rs: RunService,
    private router: Router) {}

  ngOnInit() {
    this.rs.register(this.elem, this);
    this.setHref();
  }

  // should match dv.link
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

  dvOnEvalFailure() {
    if (this.onEvalFailure) {
      this.redirect();
    }
  }

  dvOnEvalSuccess() {
    if (this.onEvalSuccess) {
      this.redirect();
    }
  }

  dvOnExecFailure() {
    if (this.onExecFailure) {
      this.redirect();
    }
  }

  dvOnExecSuccess() {
    if (this.onExecSuccess) {
      this.redirect();
    }
  }

  private redirect() {
    console.log(`dv.redirect causing a redirect to ${this.aHref}`);
    this.router.navigateByUrl(this.aHref);
  }
}
