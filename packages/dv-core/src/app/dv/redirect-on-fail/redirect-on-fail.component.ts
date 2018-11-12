import { Component, ElementRef, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RunService, OnEvalFailure, OnExecFailure } from '../run.service';


@Component({
  selector: 'dv-redirect-on-fail',
  templateUrl: './redirect-on-fail.component.html'
})
export class RedirectOnFailComponent
implements OnInit, OnEvalFailure, OnExecFailure {
  @Input() href: string;
  @Input() params;

  constructor(
    private elem: ElementRef, private rs: RunService,
    private router: Router) {}

  ngOnInit() {
    this.rs.register(this.elem, this);
  }

  dvOnEvalFailure() {
    this.redirect();
  }

  dvOnExecFailure() {
    this.redirect();
  }

  private redirect() {
    this.router.navigate([this.href, ...(this.params ? [this.params] : []) ]);
  }
}
