import {
  AfterViewInit, Component, ElementRef,
  EventEmitter, OnInit, Output
} from '@angular/core';
import { OnAfterAbort, OnAfterCommit, OnRun, RunService
} from 'dv-core';

import { User } from '../shared/authentication.model';

@Component({
  selector: 'authentication-logged-in',
  template: ''
})
export class LoggedInComponent implements OnInit, AfterViewInit {
  @Output() user = new EventEmitter();

  constructor(
    private elem: ElementRef, private rs: RunService) { }

  ngOnInit() {
    this.rs.register(this.elem, this);
  }

  ngAfterViewInit() {
    setTimeout(() => {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user) {
        this.user.emit(user);
      }
    });
  }
}
