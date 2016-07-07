import {Component, Input, OnInit} from "angular2/core";
import {HTTP_PROVIDERS} from "angular2/http";

import {Post, Username} from "../../shared/data";
import {PostService} from "../shared/post";


@Component({
  selector: "posts",
  templateUrl: "./components/posts/posts.html",
  providers: [PostService, HTTP_PROVIDERS]
})
export class PostsComponent implements OnInit {
  @Input() username: Username;
  posts: Post[];

  constructor(private _postService: PostService) {}

  ngOnInit() {
    console.log("got as input " + this.username);
    this._postService.getPosts(this.username).subscribe(
      posts => this.posts = posts);
  }
}
