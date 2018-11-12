import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';


@Component({
  selector: 'dv-callback-link',
  templateUrl: './callback-link.component.html'
})
export class CallbackLinkComponent implements OnInit {
  currentUrl: string;
  @Input() dst: string;

  constructor(private router: Router) {
    this.currentUrl = this.router.url;
  }

  ngOnInit() {
  }
}
