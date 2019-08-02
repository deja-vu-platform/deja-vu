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
  @Input() href: string;
  @Input() value: string | undefined;
  @Input() params;
  @Input() reloadOnSameUrl = false;

  constructor(
    private elem: ElementRef, private rs: RunService,
    private router: Router) {}

  ngOnInit() {
    this.rs.register(this.elem, this);
  }

  onClick() {
    this.rs.exec(this.elem);
  }

  dvOnExecSuccess() {
    const newParams = this.params ?
      _.mapValues(this.params, (value) => JSON.stringify(value)) : null;
    const url = this.router
      .createUrlTree([this.href, ...(newParams ? [newParams] : []) ]);
    if (this.reloadOnSameUrl) {
      window.location.href = this.router.serializeUrl(url);
    } else {
      this.router.navigateByUrl(url);
    }
  }
}
