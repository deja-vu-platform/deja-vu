import {Component, Input} from "angular2/core";
import {OnInit} from "angular2/core";

import {Post, Username} from "../../data";
import {PostService} from "../../services/post";


@Component({
  selector: "posts",
  templateUrl: "./post/components/posts/posts.html",
  providers: [PostService]
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
