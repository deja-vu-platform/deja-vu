import {Widget, Field} from "client-bus";

import {CommentAtom} from "../../shared/data";


@Widget({
  fqelement: "Comment",
  template: `{{comment.author.name}}`,
})
export class ShowCommentAuthorComponent {
  @Field("Comment") comment: CommentAtom;
}
