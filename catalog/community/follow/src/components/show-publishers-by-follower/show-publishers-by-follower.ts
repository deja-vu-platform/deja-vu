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
export class ShowPublishersByFollowerComponent {
  @Field("Follower") follower: FollowerAtom;

  fetched: string;
  publishers: PublisherAtom[] = [];

  constructor(
    private _followService: FollowService,
    private _atomize: Atomize
  ) {}

  dvAfterInit() {
    this.fetch();
    this.follower.on_change(() => this.fetch());
  }

  fetch() {
    if (this.fetched !== this.follower.atom_id) {
      this.fetched = this.follower.atom_id;
      if (this.follower.atom_id) {
        this.getPublishers();
      } else {
        this.publishers = [];
      }
    }
  }

  getPublishers() {
    this._followService.getPublishersByFollower(this.follower.atom_id)
      .then(publishers => {
        this.publishers = publishers.map(publisher => {
          return this._atomize.atomizePublisher(publisher);
        });
      });
  }
}
