import { Component, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'groceryship-nav-bar',
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.css']
})
export class NavBarComponent {
  @Output() loggedInUser = new EventEmitter();
  user: any;

  outputAsLoggedInUser(value) {
    console.log(value);
    this.loggedInUser.emit(value);
  }
}
