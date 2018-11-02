import { Component, ElementRef, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OnExecSuccess, RunService } from '../run.service';


@Component({
  selector: 'dv-link',
  templateUrl: './link.component.html'
})
export class LinkComponent implements OnInit, OnExecSuccess {
  @Input() href: string;

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
    this.router.navigate([this.href]);
  }
}
