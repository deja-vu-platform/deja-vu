import {Widget, ClientBus, field} from "client-bus";


@Widget({fqelement: "dv-samples-bookmark"})
export class LandingComponent {
  user_ok_redirect_route: {value: string};

  constructor(client_bus: ClientBus) {
    client_bus.init(this, [field("user_ok_redirect_route", "Text")]);
    this.user_ok_redirect_route.value = "/app/home";
  }
}
