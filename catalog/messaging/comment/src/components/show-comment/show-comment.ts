import {Widget} from "client-bus";

@Widget({
  fqelement: "dv-messaging-comment",
  template: `{{comment.content}} by {{comment.author.name}}`,
})
export class ShowCommentComponent {
  comment = {content: "", author: {name: ""}};
}
