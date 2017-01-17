import {Widget, ClientBus, field} from "client-bus";

@Widget({fqelement: "dv-samples-morg"})
export class HomeComponent {
  event_widget:{name: string, fqelement: string};

  constructor(client_bus: ClientBus) {
    client_bus.init(this, [
      field("event_widget", "Widget")]);

    this.event_widget.name = "GroupMeeting";
    this.event_widget.fqelement = "dv-samples-morg";
  }
}
