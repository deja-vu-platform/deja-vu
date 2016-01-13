import {Component, Input} from "angular2/core";
import {OnInit} from "angular2/core";

import {Post, Username} from "../../data";
import {PostService} from "../../services/post";


@Component({
  selector: "new-post",
  templateUrl: "./post/components/new-post/new-post.html",
  providers: [PostService]
})
export class NewPostComponent {
  @Input() username: Username;

  constructor(private _postService: PostService) {}
}
