import {Component, provide} from "angular2/core";
import {HTTP_PROVIDERS} from "angular2/http";

import {Post, User} from "../../shared/data";
import {PostService} from "../shared/post";


@Component({
  selector: "new-post-button",
  templateUrl: "./components/new-post-button/new-post-button.html",
  providers: [
    provide("fqelement", {useValue: "dv-messaging-post"}),
    PostService, HTTP_PROVIDERS],
  inputs: ["post", "user", "submitted"]
})
export class NewPostButtonComponent {
  submitted;
  post: Post = {content: ""};
  user: User = {username: "", posts: []};

  constructor(private _postService: PostService) {}

  valid(): boolean {
    return this.post.content !== "";
  }

  create() {
    console.log(
        "at new-post-button on save, got post " + this.post.content);
    this._postService.newPost(this.user.username, this.post.content)
      .subscribe(data => {
        this.submitted.value = true;
        this.post["atom_id"] = data.atom_id;
        // const user_up = {$addToSet: {posts: {atom_id: data.atom_id}}};
        // this._client_bus.report_update(user_up, this._user);
      });
  }
}
