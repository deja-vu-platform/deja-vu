import {
  AfterViewInit, Component, ElementRef, Inject, Input, OnChanges, OnInit, Type
} from '@angular/core';
import {
  Action, GatewayService, GatewayServiceFactory, OnEval, RunService
} from 'dv-core';
import * as _ from 'lodash';

import { API_PATH } from '../follow.config';

import {
  ShowFollowerComponent
} from '../show-follower/show-follower.component';

interface FollowersRes {
  data: { followers: string[] };
  errors: { message: string }[];
}

@Component({
  selector: 'follow-show-followers',
  templateUrl: './show-followers.component.html',
  styleUrls: ['./show-followers.component.css']
})
export class ShowFollowersComponent implements AfterViewInit, OnEval, OnInit,
OnChanges {
  // Fetch rules
  // If undefined, fetch all followers.
  // Else, fetch the followers of the given publisher.
  @Input() ofPublisherId: string | undefined;

  @Input() showFollower: Action = {
    type: <Type<Component>>ShowFollowerComponent
  };

  // Presentation text
  @Input() noFollowersToShowText = 'No followers to show';

  followers: string[] = [];

  showFollowers;
  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, @Inject(API_PATH) private apiPath) {
    this.showFollowers = this;
  }

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
      this.gs
        .get<FollowersRes>(this.apiPath, {
          params: {
            query: `
              query Followers($input: FollowersInput!) {
                followers(input: $input)
              }
            `,
            variables: JSON.stringify({
              input: {
                ofPublisherId: this.ofPublisherId
              }
            })
          }
        })
        .subscribe((res) => {
          this.followers = res.data.followers;
        });
    }
  }

  private canEval(): boolean {
    return !!(this.gs);
  }
}
