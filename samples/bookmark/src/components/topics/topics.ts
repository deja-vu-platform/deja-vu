import {ClientBus, init, field, Widget, WidgetLoader} from "client-bus";


@Widget({
  ng2_directives: [WidgetLoader],
  ng2_providers: [ClientBus]
})
export class TopicsComponent {
  constructor(client_bus: ClientBus) {
    init(this, client_bus, [field("user", "User")]);
  }
}
