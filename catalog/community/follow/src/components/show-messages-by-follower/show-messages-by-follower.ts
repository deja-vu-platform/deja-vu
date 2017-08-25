import {Widget, Field} from "client-bus";
import {GraphQlService} from "gql";

import Atomize from "../_shared/atomize";
import {FollowerAtom, MessageAtom} from "../_shared/data";
import FollowService from "../_shared/follow.service";


@Widget({
  fqelement: "Follow",
  ng2_providers: [
    GraphQlService,
    FollowService,
    Atomize
  ]
})
export class ShowMessagesByFollowerComponent {
  @Field("Follower") follower: FollowerAtom

  fetched: string;
  messages: MessageAtom[] = [];

  constructor(
    private _followService: FollowService,
    private _atomize: Atomize
  ) {}

  dvAfterInit() {
    this.fetch();
    this.follower.on_change(() => this.fetch());
  }

  fetch() {
    if (this.fetched !== this.follower.atom_id) {
      this.fetched = this.follower.atom_id;
      if (this.follower.atom_id) {
        this.getMessages();
      } else {
        this.messages = [];
      }
    }
  }

  getMessages() {
    this._followService.getMessagesByFollower(this.follower.atom_id)
      .then(messages => {
        this.messages = messages.map(message => {
          return this._atomize.atomizeMessage(message);
        });
      });
  }
}