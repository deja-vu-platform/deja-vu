import {
  Component, EventEmitter, Input, OnInit, Output
} from '@angular/core';

@Component({
  selector: 'chorestar-nav-bar',
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.css']
})
export class NavBarComponent {
  @Input() for: string;
  @Output() loggedInUser = new EventEmitter();
  user;

  outputAsLoggedInUser(user) {
    this.loggedInUser.emit(user);
  }
}
