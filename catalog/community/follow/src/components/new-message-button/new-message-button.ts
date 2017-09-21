import {Widget, Field, PrimitiveAtom} from "client-bus";
import {GraphQlService} from "gql";

import {MessageAtom, PublisherAtom} from "../_shared/data";
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
  @Field("Publisher") publisher: PublisherAtom;
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
          if (this.publisher && this.publisher.atom_id) {
            this._followService.addMessageToPublisher(
              this.publisher.atom_id,
              this.message.atom_id
            ).then(success => {
              if (success) {
                this.submit_ok.value = true;
                this.failMsg = "";
              } else {
                this.failMsg = "Failed to set message publisher.";
              }
            });
          }
        } else {
          this.failMsg = "Failed to create message.";
        }
      });
  }
}
