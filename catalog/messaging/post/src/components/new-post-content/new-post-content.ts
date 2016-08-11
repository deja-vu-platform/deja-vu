import {Component} from "angular2/core";
import {HTTP_PROVIDERS} from "angular2/http";

import {Post} from "../../shared/data";
import {PostService} from "../shared/post";


@Component({
  selector: "new-post-content",
  templateUrl: "./components/new-post-content/new-post-content.html",
  providers: [PostService, HTTP_PROVIDERS],
  inputs: ["post"]
})
export class NewPostContentComponent {
  private _post: Post = {content: ""};

  get post() {
    return this._post;
  }

  set post(post: Post) {
    if (!post) return;
    this._post = post;
  }
}
