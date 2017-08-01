import {Widget, Field} from "client-bus";

import {CommentAtom} from "../../shared/data";


@Widget({
  fqelement: "Comment",
  template: `{{comment.content}}`,
})
export class ShowCommentTextComponent {
  @Field("Comment") comment: CommentAtom;
}
