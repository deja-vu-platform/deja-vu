import {Component} from "angular2/core";
import {HTTP_PROVIDERS} from "angular2/http";

import {Post, User} from "../../shared/data";
import {PostService} from "../shared/post";


@Component({
  selector: "new-post-button",
  templateUrl: "./components/new-post-button/new-post-button.html",
  providers: [PostService, HTTP_PROVIDERS],
  inputs: ["post", "user"]
})
export class NewPostButtonComponent {
  submitted: boolean = false;
  private _post: Post = {content: ""};
  private _user: User = {username: "", posts: []};

  constructor(private _postService: PostService) {}

  get post(): Post {
    return this._post;
  }

  set post(post: Post) {
    if (!post) return;
    this._post = post;
    console.log("at new-post-button, got post" + post.content);
  }

  get user(): User {
    return this._user;
  }

  set user(user: User) {
    if (!user) return;
    this._user = user;
    console.log("at new-post-button, got user " + user.username);
  }

  valid(): boolean {
    return this._post.content !== "";
  }

  create() {
    this._postService.newPost(this._user.username, this._post.content)
      .subscribe(submitted => this.submitted = submitted);
  }
}
