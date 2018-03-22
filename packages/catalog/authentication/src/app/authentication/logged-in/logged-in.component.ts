import {
  AfterViewInit, Component, ElementRef,
  OnInit, Output
} from '@angular/core';
import { Router } from '@angular/router';
import { OnAfterCommit, RunService } from 'dv-core';
import { EventEmitter } from 'events';

import { User } from '../shared/authentication.model';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'authentication-logged-in'
})
export class LoggedInComponent implements OnInit, AfterViewInit {
  @Output() user = new EventEmitter();

  constructor(
    private elem: ElementRef, private rs: RunService,
    private router: Router) { }

  ngOnInit() {
    this.rs.register(this.elem, this);
  }

  ngAfterViewInit() {
    const userId = localStorage.getItem('user_id');
    this.user.emit({ id: userId });
  }
}
