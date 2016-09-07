import {Component} from "angular2/core";

// tmp hack
@Component({
  selector: "comment",
  template: `{{comment.content}} by {{comment.author.name}}`,
  inputs: ["comment"]
})
export class CommentComponent {}
