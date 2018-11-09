import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';


@Component({
  selector: 'dv-redirect',
  templateUrl: './redirect.component.html'
})
export class RedirectComponent implements OnInit {
  currentUrl: string;
  @Input() dst: string;

  constructor(private router: Router) {
    this.currentUrl = this.router.url;
  }

  ngOnInit() {
  }
}
