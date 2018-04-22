import {Widget, Field} from "client-bus";

import {UserAtom} from "../../shared/data";


@Widget({
  fqelement: "Chat",
  template: `{{user.username}}`
  })
export class ShowUserComponent {
  @Field("User") user: UserAtom;
}
