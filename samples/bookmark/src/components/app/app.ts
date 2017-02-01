import {Widget, ClientBus, field} from "client-bus";


@Widget({fqelement: "dv-samples-bookmark"})
export class AppComponent {
  route: {value: string};

  constructor(client_bus: ClientBus) {
    client_bus.init(this, [
      field("signout_ok", "Boolean"), field("route", "Text")]);
    this.route.value = "/landing";
  }
}
