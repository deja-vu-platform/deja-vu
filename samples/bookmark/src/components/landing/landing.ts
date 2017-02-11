import {Widget, ClientBus, field} from "client-bus";


@Widget({fqelement: "dv-samples-bookmark"})
export class LandingComponent {
  route: {value: string};

  constructor(client_bus: ClientBus) {
    client_bus.init(this, [field("route", "Text")]);
    this.route.value = "/app/home";
  }
}
