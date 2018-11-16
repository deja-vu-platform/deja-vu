import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'mapmit-nav-bar',
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.css']
})
export class NavBarComponent {
  @Output() loggedInUser = new EventEmitter();
  user: any;

  outputAsLoggedInUser(value) {
    this.loggedInUser.emit(value);
  }
}
