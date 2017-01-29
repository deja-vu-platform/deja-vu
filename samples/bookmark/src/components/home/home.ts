import {Widget, ClientBus, field} from "client-bus";


@Widget({fqelement: "dv-samples-bookmark"})
export class HomeComponent {
  feed_item_widget:{name: string, fqelement: string};

  constructor(client_bus: ClientBus) {
    client_bus.init(this, [
      field("user", "User"),
      field("feed_item_widget", "Widget")]);
    this.feed_item_widget.name = "ShowFeedPost";
    this.feed_item_widget.fqelement = "dv-samples-bookmark";
  }
}
