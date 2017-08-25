import {Widget, Field} from "client-bus";
import {GraphQlService} from "gql";

import Atomize from "../_shared/atomize";
import {PublisherAtom, MessageAtom} from "../_shared/data";
import FollowService from "../_shared/follow.service";


@Widget({
  fqelement: "Follow",
  ng2_providers: [
    GraphQlService,
    FollowService,
    Atomize
  ]
})
export class ShowMessagesByPublisherComponent {
  @Field("Publisher") publisher: PublisherAtom

  fetched: string;
  messages: MessageAtom[] = [];

  constructor(
    private _followService: FollowService,
    private _atomize: Atomize
  ) {}

  dvAfterInit() {
    this.fetch();
    this.publisher.on_change(() => this.fetch());
  }

  fetch() {
    if (this.fetched !== this.publisher.atom_id) {
      this.fetched = this.publisher.atom_id;
      if (this.publisher.atom_id) {
        this.getMessages();
      } else {
        this.messages = [];
      }
    }
  }

  getMessages() {
    this._followService.getMessagesByPublisher(this.publisher.atom_id)
      .then(messages => {
        this.messages = messages.map(message => {
          return this._atomize.atomizeMessage(message);
        });
      });
  }
}