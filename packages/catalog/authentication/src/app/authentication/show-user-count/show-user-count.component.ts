import {
  AfterViewInit, Component, ElementRef, Inject, Input, OnChanges,
  OnInit
} from '@angular/core';
import { DvService, DvServiceFactory, OnEval } from '@deja-vu/core';

import { API_PATH } from '../authentication.config';

import * as _ from 'lodash';

interface UserCountRes {
  data: { userCount: number };
}

@Component({
  selector: 'authentication-show-user-count',
  templateUrl: './show-user-count.component.html'
})
export class ShowUserCountComponent
  implements AfterViewInit, OnChanges, OnEval, OnInit {
  userCount: number;

  private dvs: DvService;

  constructor(
    private readonly elem: ElementRef, private readonly dvf: DvServiceFactory,
    @Inject(API_PATH) private readonly apiPath) { }

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .build();
  }

  ngAfterViewInit() {
    this.load();
  }

  ngOnChanges() {
    this.load();
  }

  load() {
    if (this.canEval()) {
      this.dvs.eval();
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      const res = await this.dvs.gateway.get<UserCountRes>(this.apiPath)
        .toPromise();
      this.userCount = res.data.userCount;
    } else if (this.dvs) {
      this.dvs.gateway.noRequest();
    }
  }

  private canEval(): boolean {
    return !!(this.dvs);
  }
}
