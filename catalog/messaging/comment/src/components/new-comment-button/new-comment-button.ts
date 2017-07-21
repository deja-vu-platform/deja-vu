import {GraphQlService} from "gql";
import {Widget, Field, PrimitiveAtom} from "client-bus";

import {AuthorAtom, CommentAtom, TargetAtom} from "../../shared/data";


@Widget({fqelement: "Comment", ng2_providers: [GraphQlService]})
export class NewCommentButtonComponent {
  @Field("Author") author: AuthorAtom;
  @Field("Comment") comment: CommentAtom;
  @Field("Target") target: TargetAtom;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;

  constructor(private _graphQlService: GraphQlService) {}

  addComment() {
    this._graphQlService
      .post(`
        newComment(
          author_id: "${this.author.atom_id}",
          target_id: "${this.target.atom_id}",
          content: "${this.comment.content}"
        ) {
          atom_id
        }
      `)
      .subscribe(atom_id => {
        this.comment.atom_id = atom_id;
        this.submit_ok.value = true;
      });
  }

  valid() {
    return !!this.comment.content;
  }
}
