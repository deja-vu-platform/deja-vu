import {Widget} from "client-bus";
import {Router, ROUTER_DIRECTIVES} from "angular2/router";

import {ClientBus, init, field} from "client-bus";


@Widget({
  ng2_directives: [ROUTER_DIRECTIVES],
  ng2_providers: [ClientBus]
})
export class LandingComponent {
  signin_or_register_ok;
  signin_user;

  constructor(client_bus: ClientBus, router: Router) {
    init(this, client_bus, [
      field("signin_user", "User"),
      field("register_user", "User"),
      field("signin_or_register_ok", "Boolean")]);

    this.signin_or_register_ok.on_change(() => {
      console.log("val is " + this.signin_or_register_ok.value);
      console.log(
        "sign in of " + JSON.stringify(this.signin_user.username) + " succ");
      router.navigateByUrl("/app");
    });
  }
}
