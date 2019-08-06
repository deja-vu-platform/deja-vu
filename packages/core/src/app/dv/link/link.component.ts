import { Component, ElementRef, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OnExecSuccess, RunService } from '../run.service';

import * as _ from 'lodash';


@Component({
  selector: 'dv-link',
  templateUrl: './link.component.html',
  styleUrls: ['./link.component.css']
})
export class LinkComponent implements OnInit, OnExecSuccess {
  // TODO: rename this to path
  @Input() href: string | undefined;
  @Input() value: string | undefined;
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

  onClick(e) {
    // If we don't have an href attribute then the link doesn't behave like a
    // link. For example, the user can't right click and open link in new tab.
    // We can add an href attribute manually or use `routerLink`. Either way,
    // we need to stop the propagation of the click so that angular or the
    // browser doesn't do the navigation before `dvOnExecSuccess`.
    // Note: `routerLink` doesn't respect calls to preventDefault or
    // stopPropagation (see https://github.com/angular/angular/issues/21457) so
    // we can't use it.
    e.preventDefault();
    this.rs.exec(this.elem);
  }

  dvOnExecSuccess() {
    if (this.hardRefresh) {
      window.location.href = this.aHref;
    } else {
      this.router.navigateByUrl(this.aHref);
    }
  }
}
