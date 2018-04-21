import {
  Component, ElementRef, Input, OnChanges, OnInit, Type
} from '@angular/core';
import { Action, GatewayService, GatewayServiceFactory } from 'dv-core';
import * as _ from 'lodash';

import {
  ShowPublisherComponent
} from '../show-publisher/show-publisher.component';

import { Publisher } from '../shared/follow.model';


@Component({
  selector: 'follow-show-publishers',
  templateUrl: './show-publishers.component.html',
  styleUrls: ['./show-publishers.component.css']
})
export class ShowPublishersComponent implements OnInit, OnChanges {
  // Fetch rules
  // If undefined, fetch all publishers.
  // Else, fetch the publishers of the given follower.
  @Input() followerId: string | undefined;

  @Input() showPublisher: Action = {
    type: <Type<Component>>ShowPublisherComponent
  };

  // Presentation text
  @Input() noPublishersToShowText = 'No publishers to show';

  // Whether to show the follower the option to follow/ unfollow a publisher.
  // If followerId given, it will show the the option to follow/ unfollow.
  @Input() showOptionToFollowUnfollow = false;

  publishers: Publisher[] = [];

  showPublishers;
  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory) {
    this.showPublishers = this;
  }

  ngOnInit() {
    this.gs = this.gsf.for(this.elem);
    this.fetchPublishers();
  }

  ngOnChanges() {
    this.fetchPublishers();
  }

  fetchPublishers() {
    if (this.gs) {
      this.gs
        .get<{ data: { publishers: Publisher[] } }>('/graphql', {
          params: {
            query: `
                publishers(followerId: "${this.followerId}") {
                  id
                }
              }
            `
          }
        })
        .subscribe((res) => {
          this.publishers = res.data.publishers;
        });
    }
  }
}
