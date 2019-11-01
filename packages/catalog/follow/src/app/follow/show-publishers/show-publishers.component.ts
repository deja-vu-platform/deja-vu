import {
  AfterViewInit, Component, ElementRef, Inject, Input, OnChanges, OnInit, Type
} from '@angular/core';
import {
  ComponentValue, DvService, DvServiceFactory, OnEval
} from '@deja-vu/core';
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
export class ShowPublishersComponent
  implements AfterViewInit, OnEval, OnInit, OnChanges {
  // Fetch rules
  // If undefined, fetch all publishers.
  // Else, fetch the publishers of the given follower.
  @Input() followedById: string | undefined;

  @Input() showPublisher: ComponentValue = {
    type: <Type<Component>> ShowPublisherComponent
  };

  // Presentation text
  @Input() noPublishersToShowText = 'No publishers to show';

  // Whether to show the follower the option to follow/ unfollow a publisher.
  // If followedById given, it will show the the option to follow/ unfollow.
  @Input() showOptionToFollowUnfollow = false;

  publishers: Publisher[] = [];

  showPublishers;
  private dvs: DvService;

  constructor(
    private elem: ElementRef, private dvf: DvServiceFactory,
    @Inject(API_PATH) private apiPath) {
    this.showPublishers = this;
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
      const res = await this.dvs
        .get<PublishersRes>(this.apiPath, {
          params: {
            inputs: JSON.stringify({
              input: {
                followedById: this.followedById
              }
            }),
            extraInfo: { returnFields: 'id' }
          }
        });
      this.publishers = res.data.publishers;
    } else if (this.dvs) {
      this.dvs.noRequest();
    }
  }

  private canEval(): boolean {
    return !!(this.dvs);
  }
}
