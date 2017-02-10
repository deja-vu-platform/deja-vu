import {Widget, ClientBus, field} from "client-bus";


@Widget({fqelement: "dv-samples-bookmark"})
export class HomeComponent {
  constructor(client_bus: ClientBus) {
    client_bus.init(this, [field("user", "User")]);
  }
}
