import { Component, ElementRef, Input, OnInit } from '@angular/core';

import { RunService, OnAfterCommit, OnAfterAbort } from './run.service';


const SAVED_MSG_TIMEOUT = 3000;

@Component({
  selector: 'dv-status',
  template: `
    <div *ngIf="saved">
      <i class="material-icons">done</i>
        {{savedText}}
    </div>
    <div *ngIf="error">
      <i class="material-icons">report_problem</i>
      {{error}}
    </div>
  `
})
export class StatusComponent
implements OnInit, OnAfterCommit, OnAfterAbort {
  @Input() savedText = 'Saved';
  saved = false;
  error: string;

  constructor(private elem: ElementRef, private rs: RunService) {}

  ngOnInit() {
    this.rs.register(this.elem, this);
  }

  dvOnAfterCommit() {
    this.saved = true;
    this.error = '';
    window.setTimeout(() => {
      this.saved = false;
    }, SAVED_MSG_TIMEOUT);
  }

  dvOnAfterAbort(reason: Error) {
    this.error = reason.message;
  }
}
