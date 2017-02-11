import {Widget, ClientBus, field} from "client-bus";


@Widget({fqelement: "dv-samples-bookmark"})
export class AppComponent {
  signout_ok_redirect_route: {value: string};

  constructor(client_bus: ClientBus) {
    client_bus.init(this, [
      field("signout_ok_redirect_route", "Text")]);
    this.signout_ok_redirect_route.value = "/landing";
  }
}
