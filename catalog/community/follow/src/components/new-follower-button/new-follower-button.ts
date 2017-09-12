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
export class NewFollowerButtonComponent {
  @Field("Follower") follower : FollowerAtom;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;

  failMsg: string;

  constructor(private _followService: FollowService) {}

  dvAfterInit() {
    this.submit_ok.on_after_change(() => {
      if (this.submit_ok.value) {
        this.submit_ok.value = false;
        this.follower.atom_id = "";
      }
    });
  }

  submit() {
    this._followService.createFollower()
      .then(atom_id => {
        if (atom_id) {
          this.follower.atom_id = atom_id;
          this.submit_ok.value = true;
          this.failMsg = "";
        } else {
          this.failMsg = "Failed to create follower.";
        }
      });
  }
}
