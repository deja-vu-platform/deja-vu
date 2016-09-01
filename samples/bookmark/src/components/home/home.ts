import {HTTP_PROVIDERS} from "angular2/http";

import {Widget, WidgetLoader, ClientBus, init, field} from "client-bus";


@Widget({
  ng2_directives: [WidgetLoader],
  ng2_providers: [ClientBus, HTTP_PROVIDERS]
})
export class HomeComponent {
  user = {};

  constructor(client_bus: ClientBus) {
    init(this, client_bus, [field("user", "User")]);
  }
}
