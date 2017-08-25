import {Widget} from "client-bus";
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
export class ShowMessagesComponent {
  messages: MessageAtom[] = [];

  constructor(
    private _groupService: FollowService,
    private _atomize: Atomize
  ) {}

  dvAfterInit() {
    this.messages = [];
    this._groupService.getMessages()
      .then(messages => {
        this.messages = messages.map(message => {
          return this._atomize.atomizeMessage(message);
        });
      });
  }
}