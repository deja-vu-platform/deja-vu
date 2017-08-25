import {Widget} from "client-bus";
import {GraphQlService} from "gql";

import Atomize from "../_shared/atomize";
import {FollowerAtom} from "../_shared/data";
import FollowService from "../_shared/follow.service";


@Widget({
  fqelement: "Follow",
  ng2_providers: [
    GraphQlService,
    FollowService,
    Atomize
  ]
})
export class ShowFollowersComponent {
  followers: FollowerAtom[] = [];

  constructor(
    private _followService: FollowService,
    private _atomize: Atomize
  ) {}

  dvAfterInit() {
    this.followers = [];
    this._followService.getFollowers()
      .then(followers => {
        this.followers = followers.map(follower => {
          return this._atomize.atomizeFollower(follower);
        });
      });
  }
}