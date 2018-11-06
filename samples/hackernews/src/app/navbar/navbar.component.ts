import { Component, EventEmitter, Output } from '@angular/core';
import { Router } from '@angular/router';


@Component({
  selector: 'hackernews-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  currentUrl: string;
  @Output() loggedInUser = new EventEmitter();
  user: any;

  constructor(private router: Router) {
    this.currentUrl = this.router.url;
  }

  outputAsLoggedInUser(value) {
    this.loggedInUser.emit(value);
  }
}
