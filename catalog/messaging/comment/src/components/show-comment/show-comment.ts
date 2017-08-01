import {Widget, Field} from "client-bus";

import {CommentAtom} from "../../shared/data";


@Widget({
  fqelement: "Comment"
})
export class ShowCommentComponent {
  @Field("Comment") comment: CommentAtom;
}
