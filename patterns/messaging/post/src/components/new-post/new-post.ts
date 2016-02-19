import {Component, Input} from "angular2/core";

import {Post, Username} from "../../data";
import {PostService} from "../shared/post";


@Component({
  selector: "new-post",
  templateUrl: "./components/new-post/new-post.html",
  providers: [PostService]
})
export class NewPostComponent {
  @Input() username: Username;
  post: Post = {content: ""};
  submitted: boolean = false;

  constructor(private _postService: PostService) {}

  onSubmit() {
    this._postService.newPost(this.username, this.post).subscribe(
      submitted => this.submitted = submitted);
  }
}
