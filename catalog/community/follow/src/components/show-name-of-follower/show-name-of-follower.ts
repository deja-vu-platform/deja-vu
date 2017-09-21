import {Widget, Field} from "client-bus";
import {GraphQlService} from "gql";

import {FollowerAtom} from "../_shared/data";
import FollowService from "../_shared/follow.service";


@Widget({
  fqelement: "Follow",
  ng2_providers: [
    GraphQlService,
    FollowService
  ]
})
export class ShowNameOfFollowerComponent {
  @Field("Follower") follower: FollowerAtom;

  private fetched: string;

  constructor(private _followService: FollowService) {}

  dvAfterInit() {
    if (this.follower.atom_id && !this.follower.name) {
      this.fetch();
    } else {
      this.fetched = this.follower.atom_id;
    }

    this.follower.on_change(() => this.fetch());
  }

  private fetch() {
    if (this.fetched !== this.follower.atom_id) {
      this.fetched = this.follower.atom_id;
      if (this.follower.atom_id) {
        this.getName();
      } else {
        this.follower.name = "";
      }
    }
  }

  private getName() {
    this._followService.getNameOfFollower(this.follower.atom_id)
      .then(name => this.follower.name = name);
  }
}
