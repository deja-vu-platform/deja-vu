import { Component, EventEmitter, Output } from '@angular/core';


@Component({
  selector: 'hackernews-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  currentUrl: string;
  @Output() loggedInUser = new EventEmitter();
  user: any;

  constructor() { }

  outputAsLoggedInUser(value) {
    this.loggedInUser.emit(value);
  }
}
