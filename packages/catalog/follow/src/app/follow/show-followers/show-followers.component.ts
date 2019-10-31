import {
  AfterViewInit, Component, ElementRef, Inject, Input, OnChanges, OnInit, Type
} from '@angular/core';
import {
  ComponentValue, DvService, DvServiceFactory, OnEval
} from '@deja-vu/core';
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
export class ShowFollowersComponent
  implements AfterViewInit, OnEval, OnInit, OnChanges {
  // Fetch rules
  // If undefined, fetch all followers.
  // Else, fetch the followers of the given publisher.
  @Input() ofPublisherId: string | undefined;

  @Input() showFollower: ComponentValue = {
    type: <Type<Component>>ShowFollowerComponent
  };

  // Presentation text
  @Input() noFollowersToShowText = 'No followers to show';

  followers: string[] = [];

  showFollowers;
  private dvs: DvService;

  constructor(
    private elem: ElementRef, private dvf: DvServiceFactory,
    @Inject(API_PATH) private apiPath) {
    this.showFollowers = this;
  }

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
      const res = await this.dvs.get<FollowersRes>(this.apiPath, {
        params: {
          inputs: JSON.stringify({
            input: {
              ofPublisherId: this.ofPublisherId
            }
          })
        }
      });
      this.followers = res.data.followers;
    } else if (this.dvs) {
      this.dvs.noRequest();
    }
  }

  private canEval(): boolean {
    return !!(this.dvs);
  }
}
