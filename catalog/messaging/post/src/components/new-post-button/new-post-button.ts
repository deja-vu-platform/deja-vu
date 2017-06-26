import {PostAtom, UserAtom} from "../shared/data";
import {GraphQlService} from "gql";

import {Widget, Field, PrimitiveAtom} from "client-bus";


@Widget({fqelement: "Post", ng2_providers: [GraphQlService]})
export class NewPostButtonComponent {
  @Field("boolean") submit_ok: PrimitiveAtom<boolean>;
  @Field("Post") post: PostAtom;
  @Field("User") author: UserAtom;

  constructor(private _graphQlService: GraphQlService) {}

  valid(): boolean {
    return this.post.content !== "";
  }

  create() {
    this._graphQlService
      .post(`
        newPost(
          author: "${this.author.username}", content: "${this.post.content}") {
          atom_id
        }
      `)
      .subscribe(data => {
        this.post.atom_id = data.newPost.atom_id;
        this.submit_ok.value = true;
      });
  }
}
