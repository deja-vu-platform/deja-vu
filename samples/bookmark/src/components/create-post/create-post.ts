import {Widget, ClientBus, field} from "client-bus";


@Widget()
export class CreatePostComponent {
  submit_ok;
  post;

  constructor(client_bus: ClientBus) {
    client_bus.init(this, [
      field("user", "User"),
      field("post", "Post"),
      field("submit_ok", "Boolean")
      ]);

    this.post.content = "";
    this.submit_ok.value = false;
  }
}
