import {
  AfterViewInit, Component, ElementRef, Inject, Input, OnChanges,
  OnInit
} from '@angular/core';
import { DvService, DvServiceFactory, OnEval } from '@deja-vu/core';

import { API_PATH } from '../follow.config';

import * as _ from 'lodash';

interface FollowerCountRes {
  data: { followerCount: number };
}

@Component({
  selector: 'follow-show-follower-count',
  templateUrl: './show-follower-count.component.html'
})
export class ShowFollowerCountComponent
  implements AfterViewInit, OnChanges, OnEval, OnInit {
  followerCount: number;

  @Input() ofPublisherId: string | undefined;

  private dvs: DvService;

  constructor(
    private elem: ElementRef, private dvf: DvServiceFactory,
    @Inject(API_PATH) private apiPath) { }

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
      const res = await this.dvs.get<FollowerCountRes>(this.apiPath, {
        params: {
          inputs: JSON.stringify({
            input: {
              ofPublisherId: this.ofPublisherId
            }
          })
        }
      });
      this.followerCount = res.data.followerCount;
    } else if (this.dvs) {
      this.dvs.noRequest();
    }
  }

  private canEval(): boolean {
    return !!(this.dvs);
  }
}
