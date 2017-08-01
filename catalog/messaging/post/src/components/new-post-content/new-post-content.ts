import {PostAtom, UserAtom} from "../shared/data";
import {GraphQlService} from "gql";

import {Widget, Field, PrimitiveAtom, AfterInit} from "client-bus";


@Widget({fqelement: "Post", ng2_providers: [GraphQlService]})
export class NewPostContentComponent implements AfterInit {
  @Field("Post") post: PostAtom;
  @Field("User") author: UserAtom;
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;

  constructor(private _graphQlService: GraphQlService) {}

  dvAfterInit() {
    this.submit_ok.on_change(() => {
      this._updatePost();
    });
  }

  _updatePost() {
    const author_id = this.author.atom_id ? this.author.atom_id : "";
    this._graphQlService
      .post(`
        editPost(
          atom_id: "${this.post.atom_id}",
          author_id: "${author_id}",
          content: "${this.post.content}"
        ) {
          atom_id
        }
      `)
      .subscribe(_ => {
        this.post.content = "";
      });
  }
}
