import {Component} from "angular2/core";
import {PostsComponent} from "../components/posts/posts";
import {NewPostComponent} from "../components/new-post/new-post";
import {NewPostButtonComponent} from
"../components/new-post-button/new-post-button";

@Component({
  selector: "post-pattern",
  template: `
    <h1>Posts(User)</h1>
    <posts username="benbitdiddle">Loading...</posts>
    <h1>NewPost(User)</h1>
    <new-post username="benbitdiddle">Loading...</new-post>
    <h1>NewPostButton(User)</h1>
    <new-post-button>Loading...</new-post-button>
  `,
  directives: [PostsComponent, NewPostComponent, NewPostButtonComponent]
})
export class PostPatternComponent {
  public title = "Post Pattern";
}
