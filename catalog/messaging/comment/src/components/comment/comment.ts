import {Component} from "@angular/core";

// tmp hack
@Component({
  selector: "comment",
  template: `{{comment.content}} by {{comment.author.name}}`,
  inputs: ["comment"]
})
export class CommentComponent {}
