import {
  AfterViewInit, Component, ElementRef, Inject, Input, OnChanges, OnInit, Type
} from '@angular/core';
import {
  Action, GatewayService, GatewayServiceFactory, OnEval, RunService
} from 'dv-core';
import * as _ from 'lodash';

import {
  ShowPublisherComponent
} from '../show-publisher/show-publisher.component';

import { API_PATH } from '../follow.config';
import { Publisher } from '../shared/follow.model';

interface PublishersRes {
  data: { publishers: Publisher[] };
  errors: { message: string }[];
}

@Component({
  selector: 'follow-show-publishers',
  templateUrl: './show-publishers.component.html',
  styleUrls: ['./show-publishers.component.css']
})
export class ShowPublishersComponent implements AfterViewInit, OnEval, OnInit,
OnChanges {
  // Fetch rules
  // If undefined, fetch all publishers.
  // Else, fetch the publishers of the given follower.
  @Input() followedById: string | undefined;

  @Input() showPublisher: Action = {
    type: <Type<Component>>ShowPublisherComponent
  };

  // Presentation text
  @Input() noPublishersToShowText = 'No publishers to show';

  // Whether to show the follower the option to follow/ unfollow a publisher.
  // If followedById given, it will show the the option to follow/ unfollow.
  @Input() showOptionToFollowUnfollow = false;

  publishers: Publisher[] = [];

  showPublishers;
  private gs: GatewayService;

  constructor(
    private elem: ElementRef, private gsf: GatewayServiceFactory,
    private rs: RunService, @Inject(API_PATH) private apiPath) {
    this.showPublishers = this;
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
    console.log('trying eval');
    if (this.canEval()) {
      console.log('evalling');
      this.gs
        .get<PublishersRes>(this.apiPath, {
          params: {
            query: `
              query Publishers($input: PublishersInput!) {
                publishers(input: $input) {
                  id
                }
              }
            `,
            variables: {
              input: {
                followedById: this.followedById
              }
            }
          }
        })
        .subscribe((res) => {
          this.publishers = res.data.publishers;
        });
    }
  }

  private canEval(): boolean {
    return !!(this.gs);
  }
}
