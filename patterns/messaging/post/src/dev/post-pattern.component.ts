import {Component} from "angular2/core";
import {PostsComponent} from "../components/posts/posts";
import {NewPostComponent} from "../components/new-post/new-post";

@Component({
  selector: "post-pattern",
  template: `
    <h1>Posts(User)</h1>
    <posts username="benbitdiddle">Loading...</posts>
    <h1>NewPost(User)</h1>
    <new-post username="benbitdiddle">Loading...</new-post>
  `,
  directives: [PostsComponent, NewPostComponent]
})
export class PostPatternComponent {
  public title = "Post Pattern";
}
