import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatDialog } from '@angular/material';

@Component({
  selector: 'rendezvous-nav-bar',
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.css']
})
export class NavBarComponent {
  @Input() showTitle = true;
  @Input() showProfileButton = true;
  @Input() redirectParams: any;

  @Output() loggedInUser = new EventEmitter();
  user: any;

  constructor(public dialog: MatDialog) { }

  outputAsLoggedInUser(value) {
    this.loggedInUser.emit(value);
  }
}
