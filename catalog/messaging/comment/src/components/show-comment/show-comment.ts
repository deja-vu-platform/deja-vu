import {Widget, Field} from "client-bus";

import {CommentAtom} from "../../shared/data";


@Widget({
  fqelement: "Comment",
  template: `{{comment.content}} by {{comment.author.name}}`,
})
export class ShowCommentComponent {
  @Field("Comment") comment: CommentAtom;
}
