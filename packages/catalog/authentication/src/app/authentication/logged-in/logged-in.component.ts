import {
  AfterViewInit, Component, ElementRef, EventEmitter, OnInit, Output
} from '@angular/core';
import { RunService } from '@deja-vu/core';

import { AuthenticationService } from '../shared/authentication.service';


@Component({
  selector: 'authentication-logged-in',
  templateUrl: './logged-in.component.html'
})
export class LoggedInComponent implements OnInit, AfterViewInit {
  @Output() user = new EventEmitter();

  constructor(
    private elem: ElementRef, private rs: RunService,
    private authenticationService: AuthenticationService) {}

  ngOnInit() {
    this.rs.register(this.elem, this);
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.rs.eval(this.elem);
    });
  }

  async dvOnEval(): Promise<void> {
    const user = this.authenticationService.getSignedInUser();
    if (user) {
      this.user.emit(user);
    } else {
      throw new Error('No user is logged in');
    }
  }
}
