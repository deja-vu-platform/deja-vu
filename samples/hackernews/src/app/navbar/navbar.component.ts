import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'hackernews-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  @Output() loggedInUser = new EventEmitter();
  user: any;

  outputAsLoggedInUser(value) {
    this.loggedInUser.emit(value);
  }
}
