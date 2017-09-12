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
export class EditcontentOfMessageComponent {
  @Field("Message") message: MessageAtom;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;

  failMsg: string;
  private fetched: string;

  constructor(private _followService: FollowService) {}

  dvAfterInit() {
    if (this.message.atom_id && !this.message.content) {
      this.fetch();
    } else {
      this.fetched = this.message.atom_id;
    }

    this.message.on_change(() => this.fetch());

    this.submit_ok.on_change(() => {
      if (
        this.submit_ok.value &&
        this.message.atom_id &&
        this.message.content
      ) {
        return this._followService
          .updateContentOfMessage(
            this.message.atom_id,
            this.message.content
          )
          .then(success => {
            this.failMsg = success ? "" : "Failed to update message content.";
          });
      }
    });

    this.submit_ok.on_after_change(() => {
      this.message.content = "";
    });
  }

  private fetch() {
    if (this.fetched !== this.message.atom_id) {
      this.fetched = this.message.atom_id;
      if (this.message.atom_id) {
        this.getContent();
      } else {
        this.message.content = "";
      }
    }
  }

  private getContent() {
    this._followService
      .getContentOfMessage(this.message.atom_id)
      .then(content => this.message.content = content);
  }
}
