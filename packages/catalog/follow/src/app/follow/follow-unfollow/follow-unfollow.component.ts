import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnChanges,
  OnInit, SimpleChanges, Type
} from '@angular/core';

import {
  DvService, DvServiceFactory, OnExec, OnExecSuccess
} from '@deja-vu/core';

import { API_PATH } from '../follow.config';

import * as _ from 'lodash';


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
export class FollowUnfollowComponent
  implements AfterViewInit, OnInit, OnChanges, OnExec, OnExecSuccess {
  // A list of fields to wait for
  @Input() waitOn: string[] = [];
  @Input() followerId: string;
  @Input() publisherId: string;

  // Presentation inputs
  @Input() followButtonLabel = 'Follow';
  @Input() unfollowButtonLabel = 'Unfollow';

  followsPublisher: boolean;
  private queryString: string;

  private dvs: DvService;

  constructor(
    private elem: ElementRef, private dvf: DvServiceFactory,
    @Inject(API_PATH) private apiPath) { }

  ngOnInit() {
    this.dvs = this.dvf.forComponent(this)
      .withDefaultWaiter()
      .build();
  }

  ngAfterViewInit() {
    this.load();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.dvs && this.dvs.waiter.processChanges(changes)) {
      this.load();
    }
  }

  load() {
    if (this.canEval()) {
      this.dvs.eval();
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      const res = await this.dvs.waitAndGet<IsFollowingRes>(
        this.apiPath, () => ({
          params: {
            inputs: JSON.stringify({
              input: {
                followerId: this.followerId,
                publisherId: this.publisherId
              }
            }),
            extraInfo: { action: 'is-follower' }
          }
        }));
      this.followsPublisher = res.data.isFollowing;
    }
  }

  follow() {
    this.queryString = 'follow';
    this.dvs.exec();
  }

  unfollow() {
    this.queryString = 'unfollow';
    this.dvs.exec();
  }

  async dvOnExec(): Promise<void> {
    const res = await this.dvs.post<FollowUnfollowRes>(this.apiPath, {
      inputs: {
        input: {
          followerId: this.followerId,
          publisherId: this.publisherId
        }
      },
      extraInfo: { action: this.queryString }
    });

    if (res.errors) {
      throw new Error(_.map(res.errors, 'message')
        .join());
    }

  }

  dvOnExecSuccess() {
    this.followsPublisher = this.queryString === 'follow';
    this.queryString = '';
  }

  private canEval(): boolean {
    return !!(this.dvs);
  }
}
