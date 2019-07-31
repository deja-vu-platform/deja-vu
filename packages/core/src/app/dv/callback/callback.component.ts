import {
  Component, ElementRef, EventEmitter, Input, OnInit, Output
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  OnEvalFailure, OnEvalSuccess, OnExecFailure, OnExecSuccess, RunService
} from '../run.service';
import * as _ from 'lodash';


@Component({
  selector: 'dv-callback',
  templateUrl: './callback.component.html'
})
export class CallbackComponent
implements OnEvalFailure, OnEvalSuccess, OnExecFailure, OnExecSuccess, OnInit {
  @Input() defaultHref: string = '/';
  @Input() params;
  @Input() onEvalSuccess: boolean = false;
  @Input() onEvalFailure: boolean = false;
  @Input() onExecSuccess: boolean = false;
  @Input() onExecFailure: boolean = false;
  @Output() callback = new EventEmitter<string>();

  private loadedCallback: string | undefined;

  constructor(private elem: ElementRef, private rs: RunService,
    private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    this.rs.register(this.elem, this);
    this.route.paramMap.subscribe((params) => {
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
    const href = this.loadedCallback ? this.loadedCallback : this.defaultHref;
    this.params = this.params ?
      _.mapValues(this.params, (value) => JSON.stringify(value)) : null;
    this.router.navigate([href, ...(this.params ? [this.params] : []) ]);
  }
}
