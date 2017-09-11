import {Widget, Field, PrimitiveAtom} from "client-bus";
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
export class EditNameOfFollowerComponent {
  @Field("Follower") follower: FollowerAtom;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;

  failMsg: string;
  private fetched: string;

  constructor(private _followService: FollowService) {}

  dvAfterInit() {
    if (this.follower.atom_id && !this.follower.name) {
      this.fetch();
    } else {
      this.fetched = this.follower.atom_id;
    }

    this.follower.on_change(() => this.fetch());

    this.submit_ok.on_change(() => {
      if (
        this.submit_ok.value &&
        this.follower.atom_id &&
        this.follower.name
      ) {
        return this._followService
          .updateNameOfFollower(
            this.follower.atom_id,
            this.follower.name
          )
          .then(success => {
            this.failMsg = success ? "" : "Failed to update follower name.";
          });
      }
    });

    this.submit_ok.on_after_change(() => {
      this.follower.name = "";
    });
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
    this._followService
      .getNameOfFollower(this.follower.atom_id)
      .then(name => this.follower.name = name);
  }
}