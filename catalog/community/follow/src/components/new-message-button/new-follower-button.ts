import {Widget, Field, PrimitiveAtom} from "client-bus";
import {GraphQlService} from "gql";

import {MessageAtom} from "../_shared/data";
import FollowService from "../_shared/follow.service";


@Widget({
  fqelement: "Follow",
  ng2_providers: [
    GraphQlService,
    FollowService
  ]
})
export class NewMessageButtonComponent {
  @Field("Message") message : MessageAtom;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;

  failMsg: string;

  constructor(private _followService: FollowService) {}

  dvAfterInit() {
    this.submit_ok.on_after_change(() => {
      if (this.submit_ok.value) {
        this.submit_ok.value = false;
        this.message.atom_id = "";
      }
    });
  }

  submit() {
    this._followService.createMessage()
      .then(atom_id => {
        if (atom_id) {
          this.message.atom_id = atom_id;
          this.submit_ok.value = true;
          this.failMsg = "";
        } else {
          this.failMsg = "Failed to create message.";
        }
      });
  }
}
