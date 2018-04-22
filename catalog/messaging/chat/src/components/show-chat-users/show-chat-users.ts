import {Widget, Field} from "client-bus";

import {ChatAtom} from "../../shared/data";


@Widget({fqelement: "Chat"})
export class ShowChatUsersComponent {
  @Field("Chat") chat: ChatAtom;
}
