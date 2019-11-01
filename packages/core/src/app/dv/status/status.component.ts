import { Component, ElementRef, Input, OnInit } from '@angular/core';

import {
  OnExecFailure, OnExecSuccess, RunResultMap, RunService
} from '../run.service';

import * as _ from 'lodash';

const SAVED_MSG_TIMEOUT = 3000;


@Component({
  selector: 'dv-status',
  templateUrl: './status.component.html'
})
export class StatusComponent
implements OnInit, OnExecSuccess, OnExecFailure {
  @Input() savedText = 'Saved';
  @Input() showSavedText = true;
  saved = false;
  error = '';

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

  dvOnExecFailure(unused_reason: Error, allReasons: RunResultMap) {
    this.error = _.reject(_.map(_.values(allReasons), (reason) => {
      try {
        const msg = JSON.parse(reason.message);

        return _.reject(_.map(_.get(msg, 'errors'), 'message'), _.isEmpty)
          .join();
      } catch (e) {
        return reason.message;
      }
    }), _.isEmpty)
    .join();
  }
}
