import { Component, ElementRef, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RunService, OnEvalFailure, OnExecFailure } from '../run.service';


@Component({
  selector: 'dv-redirect',
  templateUrl: './redirect.component.html'
})
export class RedirectComponent
implements OnInit, OnEvalFailure, OnExecFailure {
  @Input() href: string;
  @Input() params;
  @Input() onEvalSuccess: boolean = false;
  @Input() onEvalFailure: boolean = false;
  @Input() onExecSuccess: boolean = false;
  @Input() onExecFailure: boolean = false;

  constructor(
    private elem: ElementRef, private rs: RunService,
    private router: Router) {}

  ngOnInit() {
    this.rs.register(this.elem, this);
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
    this.router.navigate([this.href, ...(this.params ? [this.params] : []) ]);
  }
}
