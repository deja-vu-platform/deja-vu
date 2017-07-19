import {Widget, Field} from "client-bus";
import {AuthorAtom, CommentAtom, TargetAtom} from "../../shared/data";

@Widget({fqelement: "Comment"})
export class NewCommentComponent {
  @Field("Author") author: AuthorAtom;
  @Field("Comment") comment: CommentAtom;
  @Field("Target") target: TargetAtom;
}
