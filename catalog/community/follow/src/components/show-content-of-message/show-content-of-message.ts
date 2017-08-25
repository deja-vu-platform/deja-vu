import {Widget, Field} from "client-bus";
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
export class ShowContentOfMessageComponent {
  @Field("Message") message: MessageAtom;

  private fetched: string;

  constructor(private _followService: FollowService) {}

  dvAfterInit() {
    if (this.message.atom_id && !this.message.content) {
      this.fetch();
    } else {
      this.fetched = this.message.atom_id;
    }

    this.message.on_change(() => this.fetch());
  }

  private fetch() {
    if (this.fetched !== this.message.atom_id) {
      this.fetched = this.message.atom_id;
      if (this.message.atom_id) {
        this.getName();
      } else {
        this.message.content = "";
      }
    }
  }

  private getName() {
    this._followService.getContentOfMessage(this.message.atom_id)
      .then(content => this.message.content = content);
  }
}