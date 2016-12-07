import {Widget, ClientBus, field} from "client-bus";
import {HTTP_PROVIDERS} from "angular2/http";


@Widget({ng2_providers: [HTTP_PROVIDERS]})
export class HomeComponent {
  constructor(client_bus: ClientBus) {
    client_bus.init(this, [field("selected_weekly_event", "WeeklyEvent")]);
  }
}
