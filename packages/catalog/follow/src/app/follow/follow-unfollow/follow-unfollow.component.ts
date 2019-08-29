import {
  AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnChanges,
  OnInit, SimpleChanges, Type
} from '@angular/core';

import {
  GatewayService, GatewayServiceFactory, OnExec, OnExecSuccess, RunService
} from '@deja-vu/core';


import { API_PATH } from '../follow.config';

import * as _ from 'lodash';
import { filter, take } from 'rxjs/operators';


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
export class FollowUnfollowComponent implements AfterViewInit, OnInit,
  OnChanges, OnExec, OnExecSuccess {
  // A list of fields to wait for
  @Input() waitOn: string[] = [];
  // Watcher of changes to fields specified in `waitOn`
  // Emits the field name that changes
  fieldChange = new EventEmitter<string>();
  activeWaits = new Set<string>();
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
  }

  ngAfterViewInit() {
    this.load();
  }

  ngOnChanges(changes: SimpleChanges) {
    for (const field of this.waitOn) {
      if (changes[field] && !_.isNil(changes[field].currentValue)) {
        this.fieldChange.emit(field);
      }
    }
    // We should only reload iif what changed is something we are not
    // waiting on (because if ow we would send a double request)
    let shouldLoad = false;
    for (const fieldThatChanged of _.keys(changes)) {
      if (!this.activeWaits.has(fieldThatChanged)) {
        shouldLoad = true;
      }
    }
    if (shouldLoad) {
      this.load();
    }
  }

  load() {
    if (this.canEval()) {
      this.rs.eval(this.elem);
    }
  }

  async dvOnEval(): Promise<void> {
    if (this.canEval()) {
      if (!_.isEmpty(this.waitOn)) {
        await Promise.all(_.chain(this.waitOn)
          .filter((field) => _.isNil(this[field]))
          .tap((fs) => {
            this.activeWaits = new Set(fs);

            return fs;
          })
          .map((fieldToWaitFor) => this.fieldChange
            .pipe(filter((field) => field === fieldToWaitFor), take(1))
            .toPromise())
          .value());
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

  private canEval(): boolean {
    return !!(this.gs);
  }
}
