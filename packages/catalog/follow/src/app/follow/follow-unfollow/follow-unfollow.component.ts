import {
  Component, ElementRef, Inject, Input, OnChanges, OnInit
} from '@angular/core';

import {
  GatewayService, GatewayServiceFactory, OnExec, OnExecSuccess, RunService
} from '@deja-vu/core';

import * as _ from 'lodash';

import { API_PATH } from '../follow.config';

interface IsFollowingRes {
  data: { isFollowing: boolean };
  errors: { message: string }[];
}

interface FollowUnfollowRes {
  data: any;
  errors: { message: string }[];
}

@Component({
  selector: 'follow-follow-unfollow',
  templateUrl: './follow-unfollow.component.html',
  styleUrls: ['./follow-unfollow.component.css']
})
export class FollowUnfollowComponent implements
  OnInit, OnChanges, OnExec, OnExecSuccess {
  @Input() followerId: string;
  @Input() publisherId: string;

  // Presentation inputs
  @Input() followButtonLabel = 'Follow';
  @Input() unfollowButtonLabel = 'Unfollow';

  followsPublisher: boolean;
  private queryString: string;

  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, @Inject(API_PATH) private apiPath) { }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.rs.register(this.elem, this);
    this.isFollowing();
  }

  ngOnChanges() {
    this.isFollowing();
  }

  isFollowing() {
    if (!this.gs || !this.followerId || !this.publisherId) {
      return;
    }

    this.gs
      .get<IsFollowingRes>(this.apiPath, {
        params: {
          inputs: JSON.stringify({
            input: {
              followerId: this.followerId,
              publisherId: this.publisherId
            }
          }),
          extraInfo: { action: 'is-follower' }
        }
      })
      .subscribe((res) => {
        this.followsPublisher = res.data.isFollowing;
      });
  }

  follow() {
    this.queryString = 'follow';
    this.rs.exec(this.elem);
  }

  unfollow() {
    this.queryString = 'unfollow';
    this.rs.exec(this.elem);
  }

  async dvOnExec(): Promise<void> {
    const res = await this.gs.post<FollowUnfollowRes>(this.apiPath, {
      inputs: {
        input: {
          followerId: this.followerId,
          publisherId: this.publisherId
        }
      },
      extraInfo: { action: this.queryString }
    })
      .toPromise();

    if (res.errors) {
      throw new Error(_.map(res.errors, 'message')
        .join());
    }

  }

  dvOnExecSuccess() {
    this.followsPublisher = this.queryString === 'follow';
    this.queryString = '';
  }
}
