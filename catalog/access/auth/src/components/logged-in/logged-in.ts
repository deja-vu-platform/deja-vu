import {Widget, Field, AfterInit} from "client-bus";

import {UserAtom} from "../shared/data";


@Widget({fqelement: "Auth", template: ""})
export class LoggedInComponent implements AfterInit {
  @Field("User") user: UserAtom;

  dvAfterInit() {
    this.user.username = localStorage.getItem("username");
    this.user.atom_id = localStorage.getItem("atom_id");
  }
}
