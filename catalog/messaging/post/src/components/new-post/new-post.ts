import {PostAtom, UserAtom} from "../shared/data";
import {GraphQlService} from "gql";

import {Widget, Field} from "client-bus";


@Widget({fqelement: "Post", ng2_providers: [GraphQlService]})
export class NewPostComponent {
  @Field("Post") post: PostAtom;
  @Field("User") author: UserAtom;

  constructor(private _graphQlService: GraphQlService) {}

  onSubmit() {
    this._graphQlService
      .post(`
        newPost(
          author: "${this.author.username}", content: "${this.post.content}") {
          atom_id
        }
      `)
      .subscribe(atom_id => {
        this.post.atom_id = atom_id;
      });
  }
}
