import {GraphQlService} from "gql";
import {Widget, Field, PrimitiveAtom} from "client-bus";

import {AuthorAtom, CommentAtom, TargetAtom} from "../../shared/data";


@Widget({fqelement: "Comment", ng2_providers: [GraphQlService]})
export class NewCommentTextComponent {
  @Field("Author") author: AuthorAtom;
  @Field("Comment") comment: CommentAtom;
  @Field("Target") target: TargetAtom;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;

  constructor(private _graphQlService: GraphQlService) {}

  dvAfterInit() {
    this.submit_ok.on_change(() => {
      if (this.comment.atom_id) {
        this._editComment();
      } else {
        this._addComment();
      }
    });
  }

  _addComment() {
    this._graphQlService
      .get(`
        target_by_id(atom_id: "${this.target.atom_id}") {
          newComment(
            author: "${this.author.name}",
            content: "${this.comment.content}"
          ) {
            atom_id
          }
        }
      `)
      .subscribe(atom_id => {
        this.comment.atom_id = atom_id;
      });
  }

  _editComment() {
    this._graphQlService
      .post(`
        editComment(
          atom_id: "${this.comment.atom_id}",
          content: "${this.comment.content}"
        ) {
          atom_id
        }
      `)
      .subscribe(_ => undefined);
  }
}
