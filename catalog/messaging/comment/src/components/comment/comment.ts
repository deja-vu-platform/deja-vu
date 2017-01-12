import {Component} from "@angular/core";

@Component({
  selector: "comment",
  template: `{{comment.content}} by {{comment.author.name}}`,
  inputs: ["comment"]
})
export class CommentComponent {
  comment = {content: "", author: {name: ""}};
}
