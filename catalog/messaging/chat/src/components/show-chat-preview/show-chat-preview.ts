import {Widget, Field} from "client-bus";

import {ChatAtom} from "../../shared/data";


@Widget({fqelement: "Chat"})
export class ShowChatPreviewComponent {
  @Field("Chat") chat: ChatAtom;
}
