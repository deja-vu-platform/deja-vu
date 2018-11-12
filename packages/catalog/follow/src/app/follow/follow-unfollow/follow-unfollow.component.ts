import {
  Component, ElementRef, EventEmitter, Inject, Input, OnChanges, OnInit
} from '@angular/core';

import {
  GatewayService, GatewayServiceFactory, OnExec,
  RunService
} from 'dv-core';

import * as _ from 'lodash';

import { API_PATH } from '../follow.config';

const followQuery = `mutation Follow($input: FollowUnfollowInput!) {
  follow(input: $input)
}`;
const unfollowQuery = `mutation Unfollow($input: FollowUnfollowInput!) {
  unfollow(input: $input)
}`;

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
  OnInit, OnChanges, OnExec {
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
      .get<{ data: any }>(this.apiPath, {
        params: {
          query: `
              query IsFollowing($input: FollowUnfollowInput!) {
                isFollowing(input: $input)
              }
            `,
          variables: {
            input: {
              followerId: this.followerId,
              publisherId: this.publisherId
            }
          }
        }
      })
      .subscribe((res) => {
        this.followsPublisher = res.data.isFollowing;
      });
  }

  follow() {
    this.queryString = followQuery;
    this.rs.exec(this.elem);
  }

  unfollow() {
    this.queryString = unfollowQuery;
    this.rs.exec(this.elem);
  }

  async dvOnExec(): Promise<void> {
    const res = await this.gs.post<FollowUnfollowRes>(this.apiPath, {
      query: this.queryString,
      variables: {
        input: {
          followerId: this.followerId,
          publisherId: this.publisherId
        }
      }
    })
      .toPromise();

    if (res.errors) {
      throw new Error(_.map(res.errors, 'message')
        .join());
    }

    this.queryString = '';
  }
}
