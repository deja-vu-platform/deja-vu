import {Widget, Field, PrimitiveAtom} from "client-bus";
import {GraphQlService} from "gql";

import {PublisherAtom} from "../_shared/data";
import FollowService from "../_shared/follow.service";


@Widget({
  fqelement: "Follow",
  ng2_providers: [
    GraphQlService,
    FollowService
  ]
})
export class NewPublisherButtonComponent {
  @Field("Publisher") publisher : PublisherAtom;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;

  failMsg: string;

  constructor(private _followService: FollowService) {}

  dvAfterInit() {
    this.submit_ok.on_after_change(() => {
      if (this.submit_ok.value) {
        this.submit_ok.value = false;
        this.publisher.atom_id = "";
      }
    });
  }

  submit() {
    this._followService.createPublisher()
      .then(atom_id => {
        if (atom_id) {
          this.publisher.atom_id = atom_id;
          this.submit_ok.value = true;
          this.failMsg = "";
        } else {
          this.failMsg = "Failed to create publisher.";
        }
      });
  }
}