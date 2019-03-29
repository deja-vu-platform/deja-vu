import {
  AfterViewInit, Component, ElementRef, Inject, Input, OnChanges,
  OnInit
} from '@angular/core';
import {
  GatewayService, GatewayServiceFactory, OnEval, RunService
} from '@deja-vu/core';
import { map } from 'rxjs/operators';

import { API_PATH } from '../follow.config';

import * as _ from 'lodash';

interface FollowerCountRes {
  data: { followerCount: number };
}

@Component({
  selector: 'follow-show-follower-count',
  templateUrl: './show-follower-count.component.html'
})
export class ShowFollowerCountComponent implements AfterViewInit, OnChanges,
  OnEval, OnInit {
  followerCount: number;

  @Input() ofPublisherId: string | undefined;

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
      this.gs.get<FollowerCountRes>(this.apiPath, {
        params: {
          inputs: JSON.stringify({
            input: {
              ofPublisherId: this.ofPublisherId
            }
          })
        }
      })
        .pipe(map((res: FollowerCountRes) => res.data.followerCount))
        .subscribe((followerCount) => {
          this.followerCount = followerCount;
        });
    }
  }

  private canEval(): boolean {
    return !!(this.gs);
  }
}