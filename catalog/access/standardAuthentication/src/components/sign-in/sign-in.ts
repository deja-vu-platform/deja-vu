import {NgClass} from "@angular/common";

import {UserAtom} from "../shared/data";
import {GraphQlService} from "gql";
import {Widget, PrimitiveAtom, Field} from "client-bus";


@Widget({
   fqelement: "StandardAuthentication",
   ng2_providers: [GraphQlService],
   ng2_directives: [NgClass]
})
export class SignInComponent {
  @Field("User") user: UserAtom;
  @Field("boolean") signin_ok: PrimitiveAtom<boolean>;
  error = false;

  constructor(private _graphQlService: GraphQlService) {}

  onSubmit() {
    this._graphQlService
      .post(`
        signIn(
          username: "${this.user.username}", password: "${this.user.password}")
      `)
      .map(data => JSON.parse(data.signIn))
      .subscribe(
        token => {
          const authToken = token.token;
          const authUser = token.user;
          localStorage.setItem("id_token", authToken);
          localStorage.setItem("username", this.user.username);
          localStorage.setItem("atom_id", authUser.atom_id);
          this.signin_ok.value = true;
        },
        err => {
          this.error = true;
        });
  }
}
