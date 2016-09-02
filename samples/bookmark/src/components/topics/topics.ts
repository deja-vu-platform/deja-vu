import {ClientBus, init, field, Widget} from "client-bus";


@Widget({ng2_providers: [ClientBus]})
export class TopicsComponent {
  constructor(client_bus: ClientBus) {
    init(this, client_bus, [field("user", "User")]);
  }
}
