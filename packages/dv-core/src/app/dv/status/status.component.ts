import { Component, ElementRef, Input, OnInit } from '@angular/core';

import { RunService, OnExecCommit, OnExecAbort } from '../run.service';


const SAVED_MSG_TIMEOUT = 3000;

@Component({
  selector: 'dv-status',
  templateUrl: './status.component.html'
})
export class StatusComponent
implements OnInit, OnExecCommit, OnExecAbort {
  @Input() savedText = 'Saved';
  saved = false;
  error: string = '';

  constructor(private elem: ElementRef, private rs: RunService) {}

  ngOnInit() {
    this.rs.register(this.elem, this);
  }

  dvOnExecCommit() {
    this.saved = true;
    this.error = '';
    window.setTimeout(() => {
      this.saved = false;
    }, SAVED_MSG_TIMEOUT);
  }

  dvOnExecAbort(reason: Error) {
    this.error = reason.message;
  }
}
