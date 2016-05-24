import {Component} from "angular2/core";

import {Post, User} from "../../shared/data";

import {LabelsTextComponent} from
"dv-organization-label/lib/components/labels-text/labels-text";
import {NewPostContentComponent} from
"dv-messaging-post/lib/components/new-post-content/new-post-content";
import {NewPostButtonComponent} from
"dv-messaging-post/lib/components/new-post-button/new-post-button";

import {Composer} from "composer";


@Component({
  selector: "create-post",
  templateUrl: "./components/create-post/create-post.html",
  directives: [
    NewPostContentComponent, LabelsTextComponent, NewPostButtonComponent],
  inputs: ["user"]
})
export class CreatePostComponent {
  private _post = {content: ""};
  private _user = {username: "", posts: []};

  private post_post;
  private label_item;

  constructor(private _composer: Composer) {
    this.post_post = this._composer.adapt_atom(
        {name: "Post", element: "post", loc: "@@dv-messaging-post-1"},
        this._post,
        "Post");

    this.label_item = this._composer.adapt_atom(
        {name: "Item", element: "label", loc: "@@dv-organization-label-1"},
        this._post,
        "Post");
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
