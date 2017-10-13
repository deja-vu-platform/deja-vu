import {NgClass} from "@angular/common";

import {UserAtom} from "../shared/data";
import {GraphQlService} from "gql";
import {Widget, ClientBus, Field, PrimitiveAtom, WidgetValue} from "client-bus";


@Widget({
   fqelement: "StandardAuthentication",
   ng2_providers: [GraphQlService],
   ng2_directives: [NgClass]
})
export class SignInWithRedirectComponent {
  @Field("User") user: UserAtom;
  @Field("Widget") on_signin_ok: PrimitiveAtom<WidgetValue>;
  error = false;

  constructor(
    private _graphQlService: GraphQlService,
    private _client_bus: ClientBus) {}

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
          this._client_bus.navigate(this.on_signin_ok.value);
        },
        err => {
          this.error = true;
        });
  }
}
