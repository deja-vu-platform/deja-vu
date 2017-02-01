import {Widget, ClientBus, field} from "client-bus";


@Widget({fqelement: "dv-samples-bookmark"})
export class LandingComponent {
  signin_user;
  route: {value: string};

  constructor(client_bus: ClientBus) {
    client_bus.init(this, [
      field("signin_user", "User"),
      field("register_user", "User"),
      field("route", "Text")
      ]);
    this.route.value = "/app/home";
  }
}
