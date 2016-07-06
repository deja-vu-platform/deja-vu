import {Component} from "angular2/core";

import {Post, User} from "../../shared/data";

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
  private _post;
  private _user = {username: "", posts: []};

  private post_post;
  private label_item;

  constructor(private _client_bus: ClientBus) {
    this._post = this._client_bus.new_atom("Post");
    this._post.content = "";
    this.post_post = this._post
      .adapt({name: "Post", element: "post", loc: "@@dv-messaging-post-1"});

    this.label_item = this._post
      .adapt({
        name: "Item", element: "label", loc: "@@dv-organization-label-1"});
  }

  get post() {
    return this._post;
  }

  set post(post: Post) {
    if (!post) return;
    this._post = post;
    console.log("at create-post, got post " + post.content);
  }

  get user() {
    return this._user;
  }

  set user(user: User) {
    if (!user) return;
    this._user = user;
    console.log("at create-post, got user " + user.username);
  }
}
