import { Component, ElementRef, Input, OnInit } from '@angular/core';

import { OnExecFailure, OnExecSuccess, RunService } from '../run.service';


const SAVED_MSG_TIMEOUT = 3000;

@Component({
  selector: 'dv-status',
  templateUrl: './status.component.html'
})
export class StatusComponent
implements OnInit, OnExecSuccess, OnExecFailure {
  @Input() savedText = 'Saved';
  saved = false;
  error: string = '';

  constructor(private elem: ElementRef, private rs: RunService) {}

  ngOnInit() {
    this.rs.register(this.elem, this);
  }

  dvOnExecSuccess() {
    this.saved = true;
    this.error = '';
    window.setTimeout(() => {
      this.saved = false;
    }, SAVED_MSG_TIMEOUT);
  }

  dvOnExecFailure(reason: Error) {
    this.error = reason.message;
  }
}
