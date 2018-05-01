import {
  Component, ElementRef, Inject, Input, OnChanges, OnInit, Type
} from '@angular/core';
import { Action, GatewayService, GatewayServiceFactory } from 'dv-core';
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
export class ShowFollowersComponent implements OnInit, OnChanges {
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
    @Inject(API_PATH) private apiPath) {
    this.showFollowers = this;
  }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.fetchFollowers();
  }

  ngOnChanges() {
    this.fetchFollowers();
  }

  fetchFollowers() {
    if (this.gs) {
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
}
