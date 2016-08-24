import {Widget, WidgetLoader, ClientBus} from "client-bus";


@Widget({
  ng2_directives: [WidgetLoader]
})
export class CreatePostComponent {
  submitted;
  user = {username: "", posts: []};
  post_post;
  label_item;

  constructor(private _client_bus: ClientBus) {
    const post = this._client_bus.new_atom("Post");
    post.content = "";
    this.post_post = post.adapt({name: "Post", fqelement: "dv-messaging-post"});
    this.label_item = post.adapt({
      name: "Item", fqelement: "dv-organization-label"});

    this.submitted = this._client_bus.new_primitive_atom();
    this.submitted.value = false;
  }
}
