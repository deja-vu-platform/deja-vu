import {Component} from "angular2/core";

import {Post, User} from "../../shared/data";

import {NewPostContentComponent} from
"dv-messaging-post/lib/components/new-post-content/new-post-content";
import {NewPostButtonComponent} from
"dv-messaging-post/lib/components/new-post-button/new-post-button";


@Component({
  selector: "create-post",
  templateUrl: "./components/create-post/create-post.html",
  directives: [NewPostContentComponent, NewPostButtonComponent],
  inputs: ["user"]
})
export class CreatePostComponent {
  private _post = {content: ""};
  private _user = {username: "", posts: []};

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
