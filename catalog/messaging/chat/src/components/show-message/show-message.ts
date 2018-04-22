import {Widget, Field} from "client-bus";

import {MessageAtom} from "../../shared/data";


@Widget({fqelement: "Chat"})
export class ShowMessageComponent {
  @Field("Message") message: MessageAtom;
}
