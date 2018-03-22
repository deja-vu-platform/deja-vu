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
    const userId = localStorage.getItem('user_id');
    this.user.emit({ id: userId });
  }
}
