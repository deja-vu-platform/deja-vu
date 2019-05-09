import {
  AfterViewInit, Component, ElementRef, Inject, Input, OnChanges,
  OnInit} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnEval, RunService
} from '@deja-vu/core';
import { map } from 'rxjs/operators';

import { API_PATH } from '../authentication.config';

import * as _ from 'lodash';

interface UserCountRes {
  data: { userCount: number };
}

@Component({
  selector: 'authentication-show-user-count',
  templateUrl: './show-user-count.component.html'
})
export class ShowUserCountComponent implements AfterViewInit, OnChanges, OnEval,
  OnInit {
  userCount: number;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef,
    private gsf: GatewayServiceFactory,
    private rs: RunService,
    @Inject(API_PATH) private apiPath) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
  }

  ngAfterViewInit() {
    this.load();
  }

  ngOnChanges() {
    this.load();
  }

  load() {
    if (this.canEval()) {
      this.rs.eval(this.elem);
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      this.gs.get<UserCountRes>(this.apiPath)
        .pipe(map((res: UserCountRes) => res.data.userCount))
        .subscribe((userCount) => {
          this.userCount = userCount;
        });
    } else if (this.gs) {
      this.gs.noRequest();
    }
  }

  private canEval(): boolean {
    return !!(this.gs);
  }
}
