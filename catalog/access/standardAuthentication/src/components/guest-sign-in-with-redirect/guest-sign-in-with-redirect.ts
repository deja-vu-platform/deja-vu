import { NgClass } from "@angular/common";

import { UserAtom } from "../shared/data";
import { GraphQlService } from "gql";
import {
  Widget, ClientBus, Field,
  PrimitiveAtom, WidgetValue
} from "client-bus";

@Widget({
  fqelement: "StandardAuthentication",
  ng2_providers: [GraphQlService],
  ng2_directives: [NgClass]
})
export class GuestSignInWithRedirectComponent {
  @Field("User") user: UserAtom;
  @Field("Widget") on_guest_signin_ok: PrimitiveAtom<WidgetValue>;
  error = false;

  constructor(
    private _graphQlService: GraphQlService,
    private _client_bus: ClientBus) { }

  onSubmit() {
    this._graphQlService
      .post(`
            signIn(
                username: "${this.user.username}", 
                password: "${this.user.password}")
            `)
      .map(data => JSON.parse(data.signIn))
      .subscribe(
        token => {
          const guestAuthToken = token.token;
          const guestAuthUser = token.user;
          localStorage.setItem("guest_id_token", guestAuthToken);
          localStorage.setItem("guest_username", this.user.username);
          localStorage.setItem("guest_atom_id", guestAuthUser.atom_id);
          if (this.on_guest_signin_ok.value)
            this._client_bus.navigate(this.on_guest_signin_ok.value);
        },
        err => {
          this.error = true;
        });
  }
}
