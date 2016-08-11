import {Component} from "angular2/core";

import {LabelsTextComponent} from
"dv-organization-label/lib/components/labels-text/labels-text";
import {NewPostContentComponent} from
"dv-messaging-post/lib/components/new-post-content/new-post-content";
import {NewPostButtonComponent} from
"dv-messaging-post/lib/components/new-post-button/new-post-button";

import {ClientBus} from "client-bus";


@Component({
  selector: "create-post",
  templateUrl: "./components/create-post/create-post.html",
  directives: [
    NewPostContentComponent, LabelsTextComponent, NewPostButtonComponent],
  inputs: ["user"]
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
