import {Widget, WidgetLoader, ClientBus, init, field} from "client-bus";


@Widget({
  ng2_directives: [WidgetLoader]
})
export class CreatePostComponent {
  submit_ok;
  post;

  constructor(client_bus: ClientBus) {
    init(this, client_bus, [
      field("user", "User"),
      field("post", "Post"),
      field("submit_ok", "Boolean")]);

    this.post.content = "";
    this.submit_ok.value = false;
  }
}
