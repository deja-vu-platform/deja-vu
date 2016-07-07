import {Component, Input} from "angular2/core";
import {HTTP_PROVIDERS} from "angular2/http";

import {Post, Username} from "../../shared/data";
import {PostService} from "../shared/post";


@Component({
  selector: "new-post",
  templateUrl: "./components/new-post/new-post.html",
  providers: [PostService, HTTP_PROVIDERS]
})
export class NewPostComponent {
  @Input() username: Username;
  post: Post = {content: ""};
  submitted: boolean = false;

  constructor(private _postService: PostService) {}

  onSubmit() {
    this._postService.newPost(this.username, this.post.content).subscribe(
      submitted => this.submitted = submitted);
  }
}
