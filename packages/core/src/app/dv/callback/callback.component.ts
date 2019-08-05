import {
  Component, ElementRef, EventEmitter, Input, OnInit, Output
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  OnEvalFailure, OnEvalSuccess, OnExecFailure, OnExecSuccess, RunService
} from '../run.service';

import * as _ from 'lodash';


/**
 * This component is intended to be used with callback-link.
 *
 * It redirects the user to the callback URL if there is one.
 */
@Component({
  selector: 'dv-callback',
  templateUrl: './callback.component.html'
})
export class CallbackComponent
implements OnEvalFailure, OnEvalSuccess, OnExecFailure, OnExecSuccess, OnInit {
  @Input() defaultHref = '/';
  @Input() params;
  @Input() onEvalSuccess = false;
  @Input() onEvalFailure = false;
  @Input() onExecSuccess = false;
  @Input() onExecFailure = false;
  @Output() callback = new EventEmitter<string>();

  private loadedCallback: string | undefined;

  constructor(private elem: ElementRef, private rs: RunService,
    private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    this.rs.register(this.elem, this);
    this.route.queryParamMap.subscribe((params) => {
      if (params.has('callback')) {
        this.loadedCallback = JSON.parse(params.get('callback'));
        this.callback.emit(this.loadedCallback);
      }
    });
  }

  dvOnEvalFailure() {
    if (this.onEvalFailure) {
      this.redirectToCallback();
    }
  }

  dvOnEvalSuccess() {
    if (this.onEvalSuccess) {
      this.redirectToCallback();
    }
  }

  dvOnExecFailure() {
    if (this.onExecFailure) {
      this.redirectToCallback();
    }
  }

  dvOnExecSuccess() {
    if (this.onExecSuccess) {
      this.redirectToCallback();
    }
  }

  private redirectToCallback() {
    if (this.loadedCallback) {
      this.router.navigateByUrl(this.loadedCallback);
    } else {
      const newParams = _.mapValues(this.params, JSON.stringify);
      this.router.navigate([this.defaultHref], { queryParams: newParams });
    }
  }
}
