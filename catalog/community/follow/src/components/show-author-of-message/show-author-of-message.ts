import {Widget, Field} from "client-bus";
import {GraphQlService} from "gql";

import Atomize from "../_shared/atomize";
import {MessageAtom} from "../_shared/data";
import FollowService from "../_shared/follow.service";


@Widget({
  fqelement: "Follow",
  ng2_providers: [
    GraphQlService,
    FollowService,
    Atomize
  ]
})
export class ShowAuthorOfMessageComponent {
  @Field("Message") message: MessageAtom;

  private fetched: string;

  constructor(
    private _followService: FollowService,
    private _atomize: Atomize
  ) {}

  dvAfterInit() {
    if (this.message.atom_id && !this.message.author) {
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
        this.message.author = null;
      }
    }
  }

  private getName() {
    this._followService.getAuthorOfMessage(this.message.atom_id)
      .then(publisher => {
        this.message.author = this._atomize.atomizePublisher(publisher);
      });
  }
}
