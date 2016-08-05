import {Component, provide} from "angular2/core";
import {HTTP_PROVIDERS} from "angular2/http";
import {ClientBus} from "client-bus";

import {Post, User} from "../../shared/data";
import {PostService} from "../shared/post";


@Component({
  selector: "new-post-button",
  templateUrl: "./components/new-post-button/new-post-button.html",
  providers: [
    provide("fqelement", {useValue: "dv-messaging-post"}),
    PostService, ClientBus, HTTP_PROVIDERS],
  inputs: ["post", "user"]
})
export class NewPostButtonComponent {
  submitted: boolean = false;
  private _post: Post = {content: ""};
  private _user: User = {username: "", posts: []};

  constructor(
    private _postService: PostService, private _client_bus: ClientBus) {}

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
    console.log(
        "at new-post-button on save, got post " + this._post.content);
    this._postService.newPost(this._user.username, this._post.content)
      .subscribe(data => {
        this.submitted = true;
        this.post["atom_id"] = data.atom_id;
        // this._client_bus.report_save(data.atom_id, this.post).then(_ => {
        //   console.log("looks like the save finished");
        // });
        this._client_bus.broadcast("submit", {});
        // const user_up = {$addToSet: {posts: {atom_id: data.atom_id}}};
        // this._client_bus.report_update(user_up, this._user);
      });
  }
}
