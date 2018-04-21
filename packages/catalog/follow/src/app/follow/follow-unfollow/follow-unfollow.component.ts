import {
  Component, ElementRef, EventEmitter, Input, OnChanges, OnInit
} from '@angular/core';

import {
  GatewayService, GatewayServiceFactory, OnAfterAbort, OnAfterCommit, OnRun,
  RunService
} from 'dv-core';

import * as _ from 'lodash';

const followQuery = `mutation Follow($input: FollowUnfollowInput!) {
  follow(input: $input)
}`;
const unfollowQuery = `mutation Unfollow($input: FollowUnfollowInput!) {
  unfollow(input: $input)
}`;

@Component({
  selector: 'follow-follow-unfollow',
  templateUrl: './follow-unfollow.component.html',
  styleUrls: ['./follow-unfollow.component.css']
})
export class FollowUnfollowComponent implements
  OnInit, OnChanges, OnRun {
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
    private rs: RunService) { }

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
      .get<{ data: any }>('/graphql', {
        params: {
          query: `
              query IsFollowing($input: FollowUnfollowInput!) {
                isFollowing(input: $input)
              }
            `,
          variables: JSON.stringify({
            input: {
              followerId: this.followerId,
              publisherId: this.publisherId
            }
          })
        }
      })
      .subscribe((res) => {
        this.followsPublisher = res.data.isFollowing;
      });
  }

  follow() {
    this.queryString = followQuery;
    this.rs.run(this.elem);
    // TODO: update boolean here too?
  }

  unfollow() {
    this.queryString = unfollowQuery;
    this.rs.run(this.elem);
  }

  async dvOnRun(): Promise<void> {
    const res = await this.gs.post<{
      data: any, errors: { message: string }[]
    }>('/graphql', {
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
