import {Widget, Field} from "client-bus";

import {MessageAtom} from "../_shared/data";


@Widget({
  fqelement: "Follow"
})
export class ShowMessageComponent {
  @Field("Message") message: MessageAtom;
}
