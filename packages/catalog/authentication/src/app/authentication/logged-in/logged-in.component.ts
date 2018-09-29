import {
  AfterViewInit, Component, ElementRef,
  EventEmitter, OnInit, Output
} from '@angular/core';
import { OnAfterAbort, OnAfterCommit, OnRun, RunService
} from 'dv-core';

import { AuthenticationService } from '../shared/authentication.service';

import { User } from '../shared/authentication.model';

@Component({
  selector: 'authentication-logged-in',
  templateUrl: './logged-in.component.html',
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
      const user = this.authenticationService.getSignedInUser();
      if (user) {
        this.user.emit(user);
      }
    });
  }
}
