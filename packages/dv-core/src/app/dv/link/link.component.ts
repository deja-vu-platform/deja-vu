import { Component, ElementRef, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OnAfterCommit, RunService } from '../run.service';


@Component({
  selector: 'dv-link',
  templateUrl: './link.component.html'
})
export class LinkComponent implements OnInit, OnAfterCommit {
  @Input() href: string;

  constructor(
    private elem: ElementRef, private rs: RunService,
    private router: Router) {}

  ngOnInit() {
    this.rs.register(this.elem, this);
  }

  onClick() {
    this.rs.run(this.elem);
  }

  dvOnAfterCommit() {
    this.router.navigate([this.href]);
  }
}
