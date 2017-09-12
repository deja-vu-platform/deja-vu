import {Widget, Field} from "client-bus";
import {GraphQlService} from "gql";

import Atomize from "../_shared/atomize";
import {FollowerAtom, PublisherAtom} from "../_shared/data";
import FollowService from "../_shared/follow.service";


@Widget({
  fqelement: "Follow",
  ng2_providers: [
    GraphQlService,
    FollowService,
    Atomize
  ]
})
export class ShowFollowersByPublisherComponent {
  @Field("Publisher") publisher: PublisherAtom;

  fetched: string;
  followers: FollowerAtom[] = [];

  constructor(
    private _followService: FollowService,
    private _atomize: Atomize
  ) {}

  dvAfterInit() {
    this.fetch();
    this.publisher.on_change(() => this.fetch());
  }

  fetch() {
    if (this.fetched !== this.publisher.atom_id) {
      this.fetched = this.publisher.atom_id;
      if (this.publisher.atom_id) {
        this.getPublishers();
      } else {
        this.followers = [];
      }
    }
  }

  getPublishers() {
    this._followService.getFollowersByPublisher(this.publisher.atom_id)
      .then(followers => {
        this.followers = followers.map(follower => {
          return this._atomize.atomizeFollower(follower);
        });
      });
  }
}
